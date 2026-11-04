import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app import app
from database import SessionLocal
import models
from auth import hash_password

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_indian_test_data():
    db = SessionLocal()
    # Ensure Indian doctor exists
    doc = db.query(models.User).filter(models.User.email == "medical.director@medintelcrm.com").first()
    if not doc:
        doc = models.User(
            email="medical.director@medintelcrm.com",
            hashed_password=hash_password("MedDirector123!"),
            full_name="Dr. Gregory House, MBBS, MD",
            role="MEDICAL_DIRECTOR",
            medical_council_reg_no="KMC-45892",
            medical_council_name="Karnataka Medical Council",
            doctor_qualifications="MBBS, MD (General Medicine)",
            is_active=True
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)

    # Ensure Indian patient exists
    pat = db.query(models.User).filter(models.User.email == "patient.john@example.com").first()
    if not pat:
        pat = models.User(
            email="patient.john@example.com",
            hashed_password=hash_password("PatientPassword123!"),
            full_name="Johnathan Doe (Rohan Sharma)",
            role="PATIENT",
            phone="+91 98450 12345",
            abha_number="91-4589-2041-8891",
            pin_code="560038",
            city_town="Bengaluru",
            state_or_ut="Karnataka",
            is_active=True
        )
        db.add(pat)
        db.commit()
        db.refresh(pat)

    # Ensure Indian pharmacist exists
    pharm = db.query(models.User).filter(models.User.email == "pharmacist.mike@example.com").first()
    if not pharm:
        pharm = models.User(
            email="pharmacist.mike@example.com",
            hashed_password=hash_password("PharmacistPassword123!"),
            full_name="Mike Sterling, RPh (Rajesh Verma)",
            role="PHARMACIST",
            pharmacist_reg_no="KA-PH-2024-998",
            state_pharmacy_council="Karnataka State Pharmacy Council",
            is_active=True
        )
        db.add(pharm)
        db.commit()
        db.refresh(pharm)

    doc_id = doc.id
    pat_id = pat.id
    pharm_id = pharm.id
    db.close()
    return {"doctor_id": doc_id, "patient_id": pat_id, "pharmacist_id": pharm_id}


def test_indian_doctor_patient_ai_consultation(setup_indian_test_data):
    # Test consultation in Hindi
    login_resp = client.post("/api/auth/login", json={"email": "patient.john@example.com", "password": "PatientPassword123!"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    req_data = {
        "patient_message": "नमस्ते डॉक्टर, मुझे 3 दिन से बुखार और गले में दर्द है।",
        "language": "Hindi",
        "patient_age": 35,
        "patient_gender": "Male"
    }
    resp = client.post("/api/ai/doctor-consultation", json=req_data, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["language"] == "Hindi"
    assert "doctor_reply_vernacular" in data
    assert "clinical_summary_english" in data
    assert any("fever" in s.lower() or "pyrexia" in s.lower() for s in data["extracted_symptoms"])
    assert len(data["suggested_investigations"]) > 0


def test_indian_doctor_patient_ai_kannada(setup_indian_test_data):
    # Test consultation in Kannada
    login_resp = client.post("/api/auth/login", json={"email": "patient.john@example.com", "password": "PatientPassword123!"})
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    req_data = {
        "patient_message": "ನಮಸ್ಕಾರ ಡಾಕ್ಟರೇ, ನನಗೆ ತಲೆನೋವು ಮತ್ತು ಜ್ವರ ಇದೆ.",
        "language": "Kannada"
    }
    resp = client.post("/api/ai/doctor-consultation", json=req_data, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["language"] == "Kannada"
    assert "ನಮಸ್ಕಾರ" in data["doctor_reply_vernacular"]


def test_schedule_h1_statutory_logging(setup_indian_test_data):
    # 1. Doctor creates Schedule H1 prescription (Augmentin 625 Duo)
    doc_login = client.post("/api/auth/login", json={"email": "medical.director@medintelcrm.com", "password": "MedDirector123!"})
    doc_token = doc_login.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    presc_resp = client.post("/api/prescriptions", json={
        "patient_id": setup_indian_test_data["patient_id"],
        "medicine_name": "Augmentin 625 Duo",
        "generic_name": "AMOXICILLIN + CLAVULANIC ACID",
        "strength": "625mg",
        "dosage_quantity": 1.0,
        "dosage_unit": "Tablet",
        "frequency": "Twice Daily",
        "frequency_indian": "Twice Daily (BD / 1-0-1)",
        "scheduled_times": ["Morning", "Night"],
        "start_date": date.today().isoformat(),
        "food_instruction": "After Food",
        "schedule_category": "Schedule H1",
        "duration_days": 5,
        "doctor_registration_no": "KMC-45892",
        "instructions": "Complete entire course."
    }, headers=doc_headers)
    assert presc_resp.status_code == 200
    presc_id = presc_resp.json()["id"]

    # 2. Patient creates pharmacy order
    pat_login = client.post("/api/auth/login", json={"email": "patient.john@example.com", "password": "PatientPassword123!"})
    pat_token = pat_login.json()["access_token"]
    pat_headers = {"Authorization": f"Bearer {pat_token}"}

    order_resp = client.post("/api/pharmacy/orders", json={
        "prescription_id": presc_id,
        "delivery_type": "Store Pickup",
        "patient_notes": "Urgent dispensing please"
    }, headers=pat_headers)
    assert order_resp.status_code == 200
    order_id = order_resp.json()["id"]

    # 3. Pharmacist marks order as Dispensed
    pharm_login = client.post("/api/auth/login", json={"email": "pharmacist.mike@example.com", "password": "PharmacistPassword123!"})
    pharm_token = pharm_login.json()["access_token"]
    pharm_headers = {"Authorization": f"Bearer {pharm_token}"}

    dispense_resp = client.put(f"/api/pharmacy/orders/{order_id}/status", json={
        "status": "Dispensed",
        "pharmacist_notes": "Batch lot lot verified and counselled patient.",
        "dispensed_pharmacist_reg_no": "KA-PH-2024-998"
    }, headers=pharm_headers)
    assert dispense_resp.status_code == 200

    # 4. Verify that order is recorded in the statutory Schedule H1 Register
    h1_resp = client.get("/api/pharmacy/schedule-h1-register", headers=pharm_headers)
    assert h1_resp.status_code == 200
    h1_records = h1_resp.json()
    assert len(h1_records) > 0
    recent_entry = h1_records[0]
    assert recent_entry["prescriber_registration_no"] == "KMC-45892" or "KMC" in recent_entry["prescriber_registration_no"]
    assert "augmentin" in recent_entry["drug_name"].lower() or "amoxicillin" in recent_entry["drug_name"].lower()


def test_indian_diagnostic_report_with_biomarkers(setup_indian_test_data):
    pat_login = client.post("/api/auth/login", json={"email": "patient.john@example.com", "password": "PatientPassword123!"})
    pat_token = pat_login.json()["access_token"]
    pat_headers = {"Authorization": f"Bearer {pat_token}"}

    rep_resp = client.post("/api/medical-reports", json={
        "title": "HbA1c & Fasting Glucose Report",
        "report_type": "Lab Test",
        "test_category": "Biochemistry",
        "report_date": date.today().isoformat(),
        "file_name": "Thyrocare_HbA1c_Report.pdf",
        "file_size_kb": 250.0,
        "biomarkers": {
            "fasting_blood_glucose": {"value": 92, "unit": "mg/dL"},
            "hba1c": {"value": 5.4, "unit": "%"},
            "blood_pressure_systolic": {"value": 120, "unit": "mmHg"},
            "blood_pressure_diastolic": {"value": 78, "unit": "mmHg"}
        }
    }, headers=pat_headers)
    assert rep_resp.status_code == 200
    data = rep_resp.json()
    assert data["test_category"] == "Biochemistry"
    assert data["biomarkers"]["fasting_blood_glucose"]["unit"] == "mg/dL"

