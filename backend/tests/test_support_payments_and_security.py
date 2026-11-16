import pytest
from fastapi.testclient import TestClient
from backend.app import app

client = TestClient(app)

def get_auth_token(email: str = "patient.john@example.com", password: str = "PatientPassword123!"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]

def get_admin_token():
    res = client.post("/api/auth/login", json={"email": "admin@medintelcrm.com", "password": "AdminPassword123!"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_support_contact_submission():
    payload = {
        "name": "Rohan Sharma",
        "email": "rohan.sharma@example.com",
        "phone": "+91 98450 12345",
        "category": "Prescription & Medication",
        "subject": "Inquiry regarding Dolo 650 dosage timings",
        "message": "Please clarify if Dolo 650 should be taken with warm water or after breakfast."
    }
    res = client.post("/api/support/contact", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "Received"
    assert data["ticket_id"].startswith("TKT-")
    assert data["estimated_response_hours"] > 0
    assert "+91 98450 12345" in data["whatsapp_helpline"]

def test_payment_order_and_verification_flow():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create order
    create_payload = {
        "order_type": "CONSULTATION",
        "reference_id": 101,
        "amount_inr": 500.0,
        "patient_name": "Rohan Sharma",
        "payment_method": "UPI"
    }
    create_res = client.post("/api/payments/create-order", json=create_payload, headers=headers)
    assert create_res.status_code == 200
    order_data = create_res.json()
    assert "payment_id" in order_data
    assert order_data["total_amount_inr"] == 500.0
    assert order_data["status"] == "PENDING"
    assert "qr_code_upi_string" in order_data

    # 2. Verify payment
    verify_payload = {
        "payment_id": order_data["payment_id"],
        "reference_id": 101,
        "order_type": "CONSULTATION",
        "payment_method": "UPI",
        "amount_inr": 500.0
    }
    verify_res = client.post("/api/payments/verify", json=verify_payload, headers=headers)
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["status"] == "CONFIRMED"
    assert verify_data["invoice_number"].startswith("INV-")
    assert verify_data["receipt_message"] is not None

def test_email_verification_dispatch():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "email": "patient.john@example.com",
        "full_name": "John Doe"
    }
    res = client.post("/api/auth/send-verification-email", json=payload, headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["SENT", "Sent"]
    assert data["email"] == "patient.john@example.com"

def test_admin_backup_endpoint():
    admin_token = get_admin_token()
    headers = {"Authorization": f"Bearer {admin_token}"}
    res = client.post("/api/admin/backups/run", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["Success", "Complete", "Created"]
    assert "backup_file" in data
