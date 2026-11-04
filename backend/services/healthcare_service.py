import math
import time
import re
import logging
from typing import List, Optional, Dict, Any
import httpx
from sqlalchemy.orm import Session
from sqlalchemy import or_

import models

logger = logging.getLogger("healthcare_service")

# In-memory cache for external POI queries: {cache_key: (timestamp, results)}
POI_CACHE: Dict[str, tuple[float, List[Dict[str, Any]]]] = {}
CACHE_TTL = 3600  # 1 hour

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth's surface (in kilometers).
    """
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

def normalize_category(category: Optional[str]) -> Optional[str]:
    if not category or category.lower() in ("all", ""):
        return None
    cat = category.strip().lower()
    if "pharm" in cat or "store" in cat or "chemist" in cat or "aushadh" in cat:
        return "Pharmacy"
    if "clinic" in cat or "health" in cat or "doctor" in cat:
        return "Clinic"
    if "hosp" in cat or "center" in cat or "centre" in cat:
        return "Hospital"
    if "lab" in cat or "diagnost" in cat or "pathol" in cat:
        return "Diagnostic Lab"
    return category.title()

async def geocode_query(query: str) -> Optional[Dict[str, Any]]:
    """
    Geocodes a PIN code, city name, or address to (lat, lng) using OpenStreetMap Nominatim.
    Prioritizes Indian addresses and 6-digit Indian PIN codes.
    """
    try:
        url = "https://nominatim.openstreetmap.org/search"
        headers = {"User-Agent": "MedIntelPharmaCRM/2.0 (indian-healthcare-map)"}
        
        is_pin = bool(re.search(r"\b[1-9]\d{5}\b", query))
        params: Dict[str, Any] = {
            "q": query if ("india" in query.lower() or not is_pin) else f"{query}, India",
            "format": "json",
            "limit": 1
        }
        if is_pin or "india" in query.lower() or any(c in query.lower() for c in ["bengaluru", "bangalore", "delhi", "mumbai", "chennai", "kolkata", "hyderabad", "pune", "karnataka", "maharashtra", "kerala", "tamil nadu"]):
            params["countrycodes"] = "in"
        
        async with httpx.AsyncClient(timeout=6.0) as client:
            resp = await client.get(url, params=params, headers=headers)
            if resp.status_code == 200:
                data = resp.json()
                if data and len(data) > 0:
                    first = data[0]
                    return {
                        "lat": float(first["lat"]),
                        "lng": float(first["lon"]),
                        "display_name": first.get("display_name", query)
                    }
    except Exception as e:
        logger.warning("Geocoding failed for '%s': %s", query, e)
    return None

async def fetch_osm_nearby(lat: float, lng: float, radius_km: float = 10.0, category: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Queries live OpenStreetMap Overpass API for healthcare amenities nearby.
    """
    cache_key = f"{round(lat, 2)}_{round(lng, 2)}_{radius_km}_{category}"
    now = time.time()
    if cache_key in POI_CACHE:
        ts, cached = POI_CACHE[cache_key]
        if now - ts < CACHE_TTL:
            return cached

    radius_meters = int(radius_km * 1000)
    amenity_filter = ""
    norm_cat = normalize_category(category)
    if norm_cat == "Pharmacy":
        amenity_filter = '["amenity"~"pharmacy|chemist"]'
    elif norm_cat == "Clinic":
        amenity_filter = '["amenity"~"clinic|doctors"]'
    elif norm_cat == "Hospital":
        amenity_filter = '["amenity"="hospital"]'
    elif norm_cat == "Diagnostic Lab":
        amenity_filter = '["amenity"~"laboratory|diagnostic"]'
    else:
        amenity_filter = '["amenity"~"hospital|clinic|pharmacy|doctors|chemist|laboratory"]'

    overpass_query = f"""
    [out:json][timeout:8];
    (
      node{amenity_filter}(around:{radius_meters},{lat},{lng});
      way{amenity_filter}(around:{radius_meters},{lat},{lng});
    );
    out center 25;
    """

    results = []
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post("https://overpass-api.de/api/interpreter", data={"data": overpass_query})
            if resp.status_code == 200:
                payload = resp.json()
                elements = payload.get("elements", [])
                for el in elements:
                    tags = el.get("tags", {})
                    name = tags.get("name")
                    if not name:
                        continue
                    
                    e_lat = el.get("lat") or el.get("center", {}).get("lat")
                    e_lng = el.get("lon") or el.get("center", {}).get("lon")
                    if not e_lat or not e_lng:
                        continue

                    e_lat, e_lng = float(e_lat), float(e_lng)
                    amenity = tags.get("amenity", "healthcare")
                    if amenity == "pharmacy":
                        poi_type = "Pharmacy"
                    elif amenity in ("clinic", "doctors"):
                        poi_type = "Clinic"
                    else:
                        poi_type = "Hospital"

                    # Format street address if available
                    street = tags.get("addr:street", "")
                    housenumber = tags.get("addr:housenumber", "")
                    addr = f"{housenumber} {street}".strip() or tags.get("addr:full", "Local Area")

                    phone = tags.get("phone") or tags.get("contact:phone") or "Available on site"
                    hours = tags.get("opening_hours") or "Standard Healthcare Hours"

                    dist = haversine_distance(lat, lng, e_lat, e_lng)
                    results.append({
                        "id": None,
                        "name": name,
                        "type": poi_type,
                        "address": addr,
                        "city": tags.get("addr:city", "Current Region"),
                        "state": tags.get("addr:state", ""),
                        "postal_code": tags.get("addr:postcode", ""),
                        "phone": phone,
                        "latitude": e_lat,
                        "longitude": e_lng,
                        "operating_hours": hours,
                        "distance_km": dist,
                        "directions_url": f"https://www.google.com/maps/dir/?api=1&destination={e_lat},{e_lng}",
                        "is_verified": False
                    })
    except Exception as e:
        logger.warning("Overpass POI query failed, falling back to local database: %s", e)

    POI_CACHE[cache_key] = (now, results)
    return results

def get_nearby_healthcare_facilities(
    db: Session,
    lat: float,
    lng: float,
    radius_km: float = 50.0,
    category: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Returns facilities from internal verified HCO database and sorts by distance.
    """
    norm_cat = normalize_category(category)
    query = db.query(models.HCO)
    if norm_cat:
        if norm_cat == "Pharmacy":
            query = query.filter(models.HCO.type.ilike("%pharmacy%"))
        elif norm_cat == "Clinic":
            query = query.filter(models.HCO.type.ilike("%clinic%"))
        elif norm_cat == "Hospital":
            query = query.filter(or_(
                models.HCO.type.ilike("%hospital%"),
                models.HCO.type.ilike("%medical center%")
            ))

    hcos = query.all()
    results = []

    for h in hcos:
        if h.latitude is not None and h.longitude is not None:
            dist = haversine_distance(lat, lng, h.latitude, h.longitude)
            # If within generous search radius or default list
            if dist <= radius_km:
                results.append({
                    "id": h.id,
                    "name": h.name,
                    "type": "Pharmacy" if "pharmacy" in (h.type or "").lower() else ("Clinic" if "clinic" in (h.type or "").lower() else "Hospital"),
                    "address": h.address or f"{h.city}, {h.state}",
                    "city": h.city,
                    "state": h.state,
                    "postal_code": h.postal_code,
                    "phone": h.phone or "Contact facility directly",
                    "latitude": h.latitude,
                    "longitude": h.longitude,
                    "operating_hours": h.operating_hours or "24/7 Service",
                    "distance_km": dist,
                    "directions_url": f"https://www.google.com/maps/dir/?api=1&destination={h.latitude},{h.longitude}",
                    "is_verified": True
                })

    results.sort(key=lambda x: x["distance_km"])
    return results

