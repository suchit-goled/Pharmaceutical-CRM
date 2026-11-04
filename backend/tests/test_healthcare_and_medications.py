import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from app import app
from database import SessionLocal
import models

client = TestClient(app)

def get_admin_token():
    res = client.post("/api/auth/login", json={"email": "admin@medintelcrm.com", "password": "AdminPassword123!"})
    assert res.status_code == 200
    return res.json()["access_token"]

def get_rep_token():
    res = client.post("/api/auth/login", json={"email": "rep1@medintelcrm.com", "password": "RepPassword123!"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_nearby_healthcare_facilities():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Query near New York coordinates where seeded hospitals/clinics/pharmacies exist
    res = client.get("/api/healthcare/nearby?lat=40.7635&lng=-73.9575&radius_km=30", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert "name" in data[0]
    assert "distance_km" in data[0]
    assert "directions_url" in data[0]
    assert "operating_hours" in data[0]

    # Test category filter: Pharmacy
    res_pharm = client.get("/api/healthcare/nearby?lat=40.7635&lng=-73.9575&radius_km=30&category=Pharmacy", headers=headers)
    assert res_pharm.status_code == 200
    pharm_data = res_pharm.json()
    assert all(p["type"] == "Pharmacy" for p in pharm_data)

def test_healthcare_geocoding():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/healthcare/geocode?query=10065", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "lat" in data
    assert "lng" in data

def test_prescriptions_flow():
    admin_token = get_admin_token()
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Get prescriptions for admin
    res = client.get("/api/prescriptions", headers=headers)
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    assert any(p["medicine_name"] == "CardioGuard" for p in items)

    # Admin assigns a new prescription to rep1 (id=2)
    payload = {
        "patient_id": 2,
        "medicine_name": "TestAntibiotic",
        "generic_name": "Amoxicillin",
        "strength": "500mg",
        "dosage_quantity": 1.0,
        "dosage_unit": "Capsule",
        "frequency": "Twice Daily",
        "scheduled_times": ["Morning", "Night"],
        "start_date": datetime.now(timezone.utc).date().isoformat(),
        "end_date": (datetime.now(timezone.utc).date() + timedelta(days=7)).isoformat(),
        "food_instruction": "After Food",
        "instructions": "Take after breakfast and dinner."
    }
    create_res = client.post("/api/prescriptions", json=payload, headers=headers)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["medicine_name"] == "TestAntibiotic"
    assert created["patient_id"] == 2

    # Rep1 checks prescriptions -> Sees TestAntibiotic, but does NOT see Admin's prescriptions
    rep_token = get_rep_token()
    rep_res = client.get("/api/prescriptions", headers={"Authorization": f"Bearer {rep_token}"})
    assert rep_res.status_code == 200
    rep_items = rep_res.json()
    assert all(p["patient_id"] == 2 for p in rep_items)

def test_medication_schedule_and_dose_actions():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Get today's schedule
    sched_res = client.get("/api/medications/schedule/today", headers=headers)
    assert sched_res.status_code == 200
    doses = sched_res.json()
    assert len(doses) >= 1

    # Ensure we test with an unconfirmed dose
    unconfirmed = [d for d in doses if d["status"] != "Taken"]
    if not unconfirmed:
        db = SessionLocal()
        d_rec = db.query(models.MedicationScheduleLog).filter(models.MedicationScheduleLog.id == doses[0]["id"]).first()
        d_rec.status = "Scheduled"
        db.commit()
        db.close()
        target_dose = doses[0]
    else:
        target_dose = unconfirmed[0]
    dose_id = target_dose["id"]

    # Verify dose
    verify_res = client.post(
        f"/api/medications/schedule/{dose_id}/verify",
        json={"packaging_text": f"Packaging label: {target_dose['medicine_name']} {target_dose['strength']} EXP: 12/2028"},
        headers=headers
    )
    assert verify_res.status_code == 200
    v_data = verify_res.json()
    assert v_data["status"] == "VERIFIED"
    assert v_data["verified"] is True

    # Mark dose as taken
    take_res = client.post(
        f"/api/medications/schedule/{dose_id}/take",
        json={"is_verified": True, "verification_method": "AI_VISION", "verification_notes": "Verified packaging scan."},
        headers=headers
    )
    assert take_res.status_code == 200
    assert take_res.json()["status"] == "Taken"

    # Duplicate take prevention: attempting to take again must return 400 Bad Request
    dup_res = client.post(
        f"/api/medications/schedule/{dose_id}/take",
        json={"is_verified": True, "verification_method": "MANUAL"},
        headers=headers
    )
    assert dup_res.status_code == 400
    assert "already been confirmed" in dup_res.json()["detail"]

    # Snooze action on second dose if available
    if len(doses) > 1:
        snooze_id = doses[1]["id"]
        snooze_res = client.post(f"/api/medications/schedule/{snooze_id}/snooze", json={"snooze_minutes": 30}, headers=headers)
        assert snooze_res.status_code == 200
        assert snooze_res.json()["status"] == "Snoozed"

def test_medication_verification_mismatch_and_expiry():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    sched_res = client.get("/api/medications/schedule/today", headers=headers)
    doses = sched_res.json()
    dose_id = doses[0]["id"]

    # Test Mismatch: Holding GlucoFlow when scheduled dose is CardioGuard
    mismatch_res = client.post(
        f"/api/medications/schedule/{dose_id}/verify",
        json={"packaging_text": "Bottle of GlucoFlow 10mg Tablets"},
        headers=headers
    )
    assert mismatch_res.status_code == 200
    m_data = mismatch_res.json()
    if doses[0]["medicine_name"] != "GlucoFlow":
        assert m_data["status"] == "MISMATCH"
        assert m_data["verified"] is False

    # Test Expired packaging warning
    expired_res = client.post(
        f"/api/medications/schedule/{dose_id}/verify",
        json={"packaging_text": f"{doses[0]['medicine_name']} {doses[0]['strength']} EXP: 01/2020"},
        headers=headers
    )
    assert expired_res.status_code == 200
    e_data = expired_res.json()
    assert e_data["is_expired"] is True
    assert e_data["status"] in ("WARNING", "MISMATCH")

def test_adherence_report():
    token = get_admin_token()
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/medications/adherence", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "daily_adherence_rate" in data
    assert "weekly_adherence_rate" in data
    assert "total_doses" in data
    assert "taken_doses" in data
