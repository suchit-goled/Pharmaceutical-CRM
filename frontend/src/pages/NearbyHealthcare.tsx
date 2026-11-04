import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Search,
  Navigation,
  Phone,
  Clock,
  Compass,
  Building2,
  Pill,
  Cross,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import L from "leaflet";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

interface HealthcareFacility {
  id?: number | null;
  name: string;
  type: string; // Hospital, Clinic, Pharmacy
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
  operating_hours?: string;
  distance_km?: number;
  directions_url?: string;
  is_verified?: boolean;
}

export default function NearbyHealthcare() {
  const { showToast } = useToast();

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: 12.9719, lng: 77.6412 });
  const [locationLabel, setLocationLabel] = useState<string>("Bengaluru Metro, Karnataka (Default Indian Area)");
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [locating, setLocating] = useState<boolean>(false);
  const [category, setCategory] = useState<string>("All");
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searching, setSearching] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [selectedFacility, setSelectedFacility] = useState<HealthcareFacility | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current).setView([coords.lat, coords.lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
    };
  }, []);

  // Request browser geolocation on mount
  useEffect(() => {
    requestUserLocation();
  }, []);

  const requestUserLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser. Using area search.", "warning");
      return;
    }
    setLocating(true);
    setPermissionDenied(false);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        setCoords({ lat: userLat, lng: userLng });
        setLocationLabel("Your Current GPS Location");
        setLocating(false);
        showToast("GPS location detected successfully!", "success");
      },
      (err) => {
        setLocating(false);
        setPermissionDenied(true);
        if (err.code === err.PERMISSION_DENIED) {
          showToast("Location permission denied. Enter your city or PIN code below.", "warning");
        } else {
          showToast("Unable to detect GPS. Please enter your location manually.", "warning");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Fetch facilities when coordinates, category, or radius changes
  const fetchFacilities = async () => {
    setLoading(true);
    try {
      let url = `/api/healthcare/nearby?lat=${coords.lat}&lng=${coords.lng}&radius_km=${radiusKm}`;
      if (category !== "All") {
        url += `&category=${encodeURIComponent(category)}`;
      }
      const res = await api.get(url);
      setFacilities(res.data);
    } catch (err) {
      console.error(err);
      showToast("Unable to load nearby facilities. Please check connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [coords, category, radiusKm]);

  // Update map markers when facilities or coords change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    map.setView([coords.lat, coords.lng], map.getZoom() || 13);

    // User location marker (pulse beacon)
    const userMarkerHtml = `
      <div class="relative flex items-center justify-center">
        <div class="w-6 h-6 bg-indigo-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white">
          <div class="w-2 h-2 bg-white rounded-full"></div>
        </div>
        <div class="absolute w-10 h-10 bg-indigo-400 rounded-full animate-ping opacity-40"></div>
      </div>
    `;
    const userIcon = L.divIcon({
      html: userMarkerHtml,
      className: "custom-user-marker",
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    L.marker([coords.lat, coords.lng], { icon: userIcon })
      .bindPopup(`<div class="font-sans text-xs"><b>You Are Here</b><br/>${locationLabel}</div>`)
      .addTo(layer);

    // Facility markers
    facilities.forEach((f) => {
      if (f.latitude && f.longitude) {
        let pinColor = "bg-indigo-600";
        let letter = "H";
        if (f.type === "Pharmacy") {
          pinColor = "bg-emerald-600";
          letter = "P";
        } else if (f.type === "Clinic") {
          pinColor = "bg-purple-600";
          letter = "C";
        }

        const facilityHtml = `
          <div class="cursor-pointer transition transform hover:scale-110 flex items-center justify-center w-8 h-8 ${pinColor} text-white font-bold text-xs rounded-xl shadow-md border-2 border-white">
            ${letter}
          </div>
        `;
        const icon = L.divIcon({
          html: facilityHtml,
          className: "custom-facility-pin",
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([f.latitude, f.longitude], { icon }).addTo(layer);
        marker.on("click", () => {
          setSelectedFacility(f);
        });

        const popupContent = `
          <div class="p-1 font-sans text-xs min-w-[180px]">
            <p class="font-bold text-slate-900 text-sm">${f.name}</p>
            <p class="text-indigo-600 font-semibold mt-0.5">${f.type} • ${f.distance_km || 0} km</p>
            <p class="text-slate-500 mt-1">${f.address || ""}</p>
            <p class="text-slate-600 text-[11px] mt-1">📞 ${f.phone || "On site"}</p>
            <a href="${f.directions_url}" target="_blank" rel="noopener noreferrer" class="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100">
              Directions ➔
            </a>
          </div>
        `;
        marker.bindPopup(popupContent);
      }
    });
  }, [facilities, coords]);

  // Handle Geocoding Search
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await api.get(`/api/healthcare/geocode?query=${encodeURIComponent(searchQuery)}`);
      const { lat, lng, display_name } = res.data;
      setCoords({ lat, lng });
      setLocationLabel(display_name);
      setPermissionDenied(false);
      showToast(`Location set to: ${display_name.slice(0, 35)}...`, "success");
    } catch (err: any) {
      showToast(err.response?.data?.detail || "Location not found. Try a PIN code or major city.", "error");
    } finally {
      setSearching(false);
    }
  };

  const focusFacilityOnMap = (f: HealthcareFacility) => {
    setSelectedFacility(f);
    if (f.latitude && f.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([f.latitude, f.longitude], 15, { duration: 1.2 });
    }
  };

  return (
    <DashboardLayout
      title="Nearby Healthcare & Pharmacy Map"
      subtitle="Locate nearest verified pharmacies, clinics and medical centers with distance calculation and directions"
    >
      {/* Top Banner / Location Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Compass size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm">{locationLabel}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">Active</span>
            </div>
            <p className="text-xs text-slate-500">
              Coordinates: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)} • Radius: {radiusKm} km
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Location Manual Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 sm:flex-initial">
            <div className="relative flex-1 sm:w-64">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search 6-digit PIN (e.g. 560038), locality, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              {searching ? "Finding..." : "Go"}
            </button>
          </form>

          {/* GPS Button */}
          <button
            onClick={requestUserLocation}
            disabled={locating}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
            title="Detect GPS Location"
          >
            <Navigation size={15} className={`text-indigo-600 ${locating ? "animate-spin" : ""}`} />
            <span>{locating ? "Detecting..." : "Use My GPS"}</span>
          </button>

          {/* Radius Selector */}
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="px-3 py-2 border border-slate-200 bg-slate-50 rounded-xl text-xs text-slate-700 outline-none"
          >
            <option value={5}>Within 5 km</option>
            <option value={10}>Within 10 km</option>
            <option value={25}>Within 25 km</option>
            <option value={50}>Within 50 km</option>
          </select>
        </div>
      </div>

      {permissionDenied && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-amber-800 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <span>
              <b>GPS Location Disabled:</b> You can type your local neighborhood, city, or postal code in the search bar above to view nearby facilities.
            </span>
          </div>
          <button
            onClick={requestUserLocation}
            className="underline font-bold text-amber-900 ml-2 hover:text-amber-950"
          >
            Retry GPS
          </button>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {[
          { label: "All Facilities", val: "All", icon: Compass },
          { label: "Pharmacies & Medical Stores", val: "Pharmacy", icon: Pill },
          { label: "Clinics & Polyclinics", val: "Clinic", icon: Cross },
          { label: "Hospitals & Medical Centers", val: "Hospital", icon: Building2 },
          { label: "Diagnostic Labs & Pathology", val: "Diagnostic Lab", icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const active = category === tab.val;
          return (
            <button
              key={tab.val}
              onClick={() => setCategory(tab.val)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition shadow-sm ${
                active
                  ? "bg-indigo-600 text-white shadow-indigo-100"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {active && (
                <span className="ml-1 px-1.5 py-0.2 bg-white/20 text-white text-[10px] rounded-full">
                  {facilities.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Split View: Facility Cards List + Interactive Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Facilities List */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[720px] overflow-y-auto pr-1">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs font-semibold text-slate-500">Discovering nearby healthcare providers...</p>
            </div>
          ) : facilities.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-3">
                <MapPin size={24} />
              </div>
              <h4 className="text-sm font-bold text-slate-800">No facilities found within {radiusKm} km</h4>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Try expanding the search radius or searching by a larger city or PIN code.
              </p>
              <button
                onClick={() => setRadiusKm(50)}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-xl hover:bg-indigo-100 transition"
              >
                Expand to 50 km Radius
              </button>
            </div>
          ) : (
            facilities.map((facility, idx) => {
              const isSelected = selectedFacility?.name === facility.name;
              let badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200";
              if (facility.type === "Pharmacy") {
                badgeColor = "bg-emerald-50 text-emerald-700 border-emerald-200";
              } else if (facility.type === "Clinic") {
                badgeColor = "bg-purple-50 text-purple-700 border-purple-200";
              }

              return (
                <div
                  key={`${facility.name}-${idx}`}
                  onClick={() => focusFacilityOnMap(facility)}
                  className={`bg-white p-4 rounded-2xl border transition cursor-pointer shadow-sm ${
                    isSelected
                      ? "border-indigo-600 ring-2 ring-indigo-500/20 shadow-md"
                      : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                          {facility.type}
                        </span>
                        {facility.is_verified && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                            <ShieldCheck size={12} /> Verified
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 tracking-tight">{facility.name}</h4>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg shrink-0">
                      {facility.distance_km} km
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span>{facility.address || `${facility.city || ""}, ${facility.state || ""}`}</span>
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{facility.phone || "Call on site"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{facility.operating_hours || "Standard Hours"}</span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        focusFacilityOnMap(facility);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Show on Map
                    </button>
                    <a
                      href={facility.directions_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
                    >
                      <span>Directions</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Interactive Map */}
        <div className="lg:col-span-7 sticky top-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            {/* Map Header */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold flex items-center gap-1.5">
                <Compass size={15} className="text-indigo-600" /> Interactive Healthcare GeoMap
              </span>
              <span className="text-slate-500 text-[11px]">
                Showing {facilities.length} locations • OpenStreetMap Leaflet
              </span>
            </div>

            {/* Map Container */}
            <div
              ref={mapContainerRef}
              className="w-full h-[620px] bg-slate-100 z-10"
              style={{ minHeight: "560px" }}
            />

            {/* Map Compliance / Inventory Disclaimer Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
              <span>
                <b>Note:</b> Operating hours and healthcare markers are informational. Turn-by-turn directions powered by Google Maps.
              </span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1 shrink-0">
                <CheckCircle2 size={13} /> HIPAA/PDMA Compliant
              </span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
