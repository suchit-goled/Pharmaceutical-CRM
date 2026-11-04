import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app import app
from database import SessionLocal
import models
from auth import hash_password

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_test_users():
    db = SessionLocal()
    # Check or create patient
    pat = db.query(models.User).filter(models.User.email == "patient.workflow@test.com").first()
    if not pat:
        pat = models.User(
            email="patient.workflow@test.com",
            hashed_password=hash_password("Patient123!"),
            full_name="Patient Workflow Test",
            role="PATIENT",
            is_active=True
        )
        db.add(pat)
        db.commit()
        db.refresh(pat)
    
    # Check or create pharmacist
    pharm = db.query(models.User).filter(models.User.email == "pharm.workflow@test.com").first()
    if not pharm:
        pharm = models.User(
            email="pharm.workflow@test.com",
            hashed_password=hash_password("Pharm123!"),
            full_name="Pharmacist Workflow Test",
            role="PHARMACIST",
            is_active=True
        )
        db.add(pharm)
        db.commit()
        db.refresh(pharm)

    # Check or create prescription for this patient
    presc = db.query(models.Prescription).filter(models.Prescription.patient_id == pat.id).first()
    if not presc:
        admin = db.query(models.User).filter(models.User.role == "ADMIN").first()
        presc = models.Prescription(
            patient_id=pat.id,
            prescriber_id=admin.id,
            medicine_name="CardioGuard",
            strength="20mg",
            dosage_quantity=1.0,
            dosage_unit="Tablet",
            frequency="Once Daily",
            scheduled_times=["Morning"],
            start_date=date.today(),
            end_date=date.today() + timedelta(days=30),
            status="Active"
        )
        db.add(presc)
        db.commit()
        db.refresh(presc)

    pat_id = pat.id
    pharm_id = pharm.id
    presc_id = presc.id
    db.close()
    return {"patient_id": pat_id, "pharmacist_id": pharm_id, "prescription_id": presc_id}

def test_appointments_workflow(setup_test_users):
    # 1. Login as patient
    pat_res = client.post("/api/auth/login", json={"email": "patient.workflow@test.com", "password": "Patient123!"})
    assert pat_res.status_code == 200
    pat_token = pat_res.json()["access_token"]
    pat_headers = {"Authorization": f"Bearer {pat_token}"}

    # 2. Book appointment
    book_payload = {
        "appointment_date": str(date.today() + timedelta(days=2)),
        "slot_time": "10:30 AM",
        "appointment_type": "Consultation",
        "reason": "Routine hypertension checkup and prescription renewal"
    }
    book_res = client.post("/api/appointments", json=book_payload, headers=pat_headers)
    assert book_res.status_code == 200
    appt_id = book_res.json()["id"]
    assert book_res.json()["status"] == "Requested"

    # 3. Login as doctor (Medical Director)
    doc_res = client.post("/api/auth/login", json={"email": "medical.director@medintelcrm.com", "password": "MedDirector123!"})
    assert doc_res.status_code == 200
    doc_token = doc_res.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    # 4. Doctor accepts appointment
    confirm_res = client.put(f"/api/appointments/{appt_id}/status", json={"status": "Confirmed"}, headers=doc_headers)
    assert confirm_res.status_code == 200
    assert confirm_res.json()["status"] == "Confirmed"

    # 5. Doctor conducts consultation
    consult_payload = {
        "clinical_notes": "BP recorded at 125/82 mmHg. Patient adheres well to medication. No adverse side effects.",
        "diagnosis": "Controlled Essential Hypertension",
        "status": "Completed"
    }
    consult_res = client.put(f"/api/appointments/{appt_id}/consultation", json=consult_payload, headers=doc_headers)
    assert consult_res.status_code == 200
    assert consult_res.json()["status"] == "Completed"
    assert consult_res.json()["diagnosis"] == "Controlled Essential Hypertension"

def test_pharmacy_orders_workflow(setup_test_users):
    presc_id = setup_test_users["prescription_id"]

    # 1. Patient places pharmacy order
    pat_res = client.post("/api/auth/login", json={"email": "patient.workflow@test.com", "password": "Patient123!"})
    pat_token = pat_res.json()["access_token"]
    pat_headers = {"Authorization": f"Bearer {pat_token}"}

    order_payload = {
        "prescription_id": presc_id,
        "delivery_type": "Store Pickup",
        "patient_notes": "Please prepare for evening pickup after 5 PM"
    }
    order_res = client.post("/api/pharmacy/orders", json=order_payload, headers=pat_headers)
    assert order_res.status_code == 200
    order_data = order_res.json()
    order_id = order_data["id"]
    assert order_data["status"] == "Pending Verification"

    # 2. Pharmacist logs in and processes order
    pharm_res = client.post("/api/auth/login", json={"email": "pharm.workflow@test.com", "password": "Pharm123!"})
    pharm_token = pharm_res.json()["access_token"]
    pharm_headers = {"Authorization": f"Bearer {pharm_token}"}

    # Verify order
    status_res = client.put(f"/api/pharmacy/orders/{order_id}/status", json={
        "status": "Ready for Pickup",
        "pharmacist_notes": "Prescription verified. 30-day bottle packaged."
    }, headers=pharm_headers)
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "Ready for Pickup"

    # Dispense order
    disp_res = client.put(f"/api/pharmacy/orders/{order_id}/status", json={
        "status": "Dispensed",
        "pharmacist_notes": "Handed to patient with verbal counseling."
    }, headers=pharm_headers)
    assert disp_res.status_code == 200
    assert disp_res.json()["status"] == "Dispensed"
    assert disp_res.json()["dispensed_at"] is not None

def test_medical_reports_workflow(setup_test_users):
    # 1. Patient uploads report
    pat_res = client.post("/api/auth/login", json={"email": "patient.workflow@test.com", "password": "Patient123!"})
    pat_token = pat_res.json()["access_token"]
    pat_headers = {"Authorization": f"Bearer {pat_token}"}

    rep_payload = {
        "title": "Comprehensive Blood Panel (Lipid & Metabolic)",
        "report_type": "Lab Test",
        "report_date": str(date.today()),
        "file_name": "Lipid_Panel_Report.pdf",
        "file_size_kb": 850.5
    }
    rep_res = client.post("/api/medical-reports", json=rep_payload, headers=pat_headers)
    assert rep_res.status_code == 200
    rep_id = rep_res.json()["id"]
    assert rep_res.json()["status"] == "Uploaded"

    # 2. Doctor reviews report
    doc_res = client.post("/api/auth/login", json={"email": "medical.director@medintelcrm.com", "password": "MedDirector123!"})
    doc_token = doc_res.json()["access_token"]
    doc_headers = {"Authorization": f"Bearer {doc_token}"}

    review_res = client.put(f"/api/medical-reports/{rep_id}/review", json={
        "clinical_observations": "Total cholesterol 175 mg/dL, LDL 95 mg/dL. Statins regimen is performing effectively.",
        "status": "Reviewed"
    }, headers=doc_headers)
    assert review_res.status_code == 200
    assert review_res.json()["status"] == "Reviewed"
    assert "Statins regimen" in review_res.json()["clinical_observations"]

def test_pharmacy_inventory_workflow(setup_test_users):
    # 1. Pharmacist views inventory
    pharm_res = client.post("/api/auth/login", json={"email": "pharm.workflow@test.com", "password": "Pharm123!"})
    pharm_token = pharm_res.json()["access_token"]
    pharm_headers = {"Authorization": f"Bearer {pharm_token}"}

    inv_res = client.get("/api/pharmacy/inventory", headers=pharm_headers)
    assert inv_res.status_code == 200
    assert len(inv_res.json()) >= 1
    first_item = inv_res.json()[0]

    # 2. Update stock
    up_res = client.put(f"/api/pharmacy/inventory/{first_item['id']}", json={
        "stock_quantity": 250,
        "unit_price": 26.00
    }, headers=pharm_headers)
    assert up_res.status_code == 200
    assert up_res.json()["stock_quantity"] == 250

