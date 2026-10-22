import pytest
from fastapi.testclient import TestClient
from app import app
from database import SessionLocal
import models
from auth import hash_password

client = TestClient(app)

def test_health_endpoints():
    res = client.get("/healthz")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    res_ready = client.get("/readyz")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"

def test_security_headers():
    res = client.get("/healthz")
    assert res.headers.get("x-frame-options") == "DENY"
    assert res.headers.get("x-content-type-options") == "nosniff"
    assert "strict-origin-when-cross-origin" in res.headers.get("referrer-policy", "")

def test_auth_login_success():
    payload = {
        "email": "admin@medintelcrm.com",
        "password": "AdminPassword123!"
    }
    res = client.post("/api/auth/login", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["role"] == "ADMIN"
    assert data["user"]["email"] == "admin@medintelcrm.com"

def test_auth_login_invalid_password():
    payload = {
        "email": "admin@medintelcrm.com",
        "password": "WrongPassword!"
    }
    res = client.post("/api/auth/login", json=payload)
    assert res.status_code == 401

def test_rbac_admin_restriction():
    # Login as sales rep
    rep_res = client.post("/api/auth/login", json={"email": "rep1@medintelcrm.com", "password": "RepPassword123!"})
    assert rep_res.status_code == 200
    rep_token = rep_res.json()["access_token"]

    # Try to access admin endpoint with rep token -> Should be 403 Forbidden
    res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {rep_token}"})
    assert res.status_code == 403

    # Now login as admin
    admin_res = client.post("/api/auth/login", json={"email": "admin@medintelcrm.com", "password": "AdminPassword123!"})
    admin_token = admin_res.json()["access_token"]

    # Admin should succeed
    res_admin = client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    assert "items" in res_admin.json()

def test_admin_dashboard_stats():
    admin_res = client.post("/api/auth/login", json={"email": "admin@medintelcrm.com", "password": "AdminPassword123!"})
    admin_token = admin_res.json()["access_token"]

    res = client.get("/api/admin/stats", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["total_users"] >= 6
    assert data["total_hcps"] >= 5
    assert data["total_products"] >= 5
    assert "sentiment_breakdown" in data

def test_hcp_listing_and_filtering():
    res = client.get("/api/hcps?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] >= 5
    assert len(data["items"]) >= 1

    # Filter by specialty
    res_cardio = client.get("/api/hcps?specialty=Cardiology")
    assert res_cardio.status_code == 200
    for hcp in res_cardio.json()["items"]:
        assert hcp["specialty"] == "Cardiology"

def test_product_catalogue():
    res = client.get("/api/products")
    assert res.status_code == 200
    items = res.json()["items"]
    assert len(items) >= 5
    brand_names = [p["brand_name"] for p in items]
    assert "CardioGuard" in brand_names
    assert "OncoShield" in brand_names

def test_interaction_backward_compatibility():
    # Test existing /save endpoint
    payload = {
        "doctor": "Dr. Automated Test",
        "hospital": "Test Medical Center",
        "specialization": "Oncology",
        "interactionType": "Scientific Exchange",
        "visitDate": "2026-10-20",
        "visitTime": "14:00",
        "attendees": "Dr. Test, Lead Pharmacist",
        "product": "OncoShield",
        "materials": "Clinical Trial Monograph",
        "samples": 2,
        "notes": "Discussed clinical study endpoints. Physician expressed keen interest.",
        "sentiment": "Positive",
        "outcomes": "Agreed to review trial protocols.",
        "followUp": "2026-11-04",
        "summary": "Positive clinical detailing on OncoShield."
    }
    save_res = client.post("/save", json=payload)
    assert save_res.status_code == 200
    interaction_id = save_res.json()["id"]

    # Verify retrieval via /interactions
    list_res = client.get("/interactions")
    assert list_res.status_code == 200
    ids = [i["id"] for i in list_res.json()]
    assert interaction_id in ids

    # Verify single fetch via /interaction/{id}
    get_res = client.get(f"/interaction/{interaction_id}")
    assert get_res.status_code == 200
    assert get_res.json()["doctor"] == "Dr. Automated Test"

    # Cleanup test record
    del_res = client.delete(f"/interaction/{interaction_id}")
    assert del_res.status_code == 200

def test_lead_lifecycle_and_conversion():
    # 1. Create a Lead
    lead_payload = {
        "contact_name": "Dr. Sarah Jenkins",
        "organization_name": "Metro North Hospital",
        "email": "s.jenkins@metronorth.org",
        "phone": "+1 (555) 019-3322",
        "specialty": "Cardiology",
        "stage": "Qualified",
        "lead_score": 88,
        "source": "Scientific Symposium",
        "notes": "Interested in evaluating CardioGuard for inpatient lipid management."
    }
    lead_res = client.post("/api/leads", json=lead_payload)
    assert lead_res.status_code == 200
    lead_id = lead_res.json()["id"]

    # 2. Convert Lead to HCP
    convert_res = client.post(f"/api/leads/{lead_id}/convert")
    assert convert_res.status_code == 200
    hcp_data = convert_res.json()
    assert hcp_data["first_name"] == "Sarah"
    assert hcp_data["last_name"] == "Jenkins"
    assert hcp_data["specialty"] == "Cardiology"

def test_ai_fallback_resilience():
    # Post conversation prompt to /generate
    prompt_payload = {
        "prompt": "Met with Dr. Robert Smith at General Hospital today regarding CardioGuard. Gave 4 samples. Doctor was impressed with lipid lowering efficacy and wants to follow up in two weeks."
    }
    res = client.post("/generate", json=prompt_payload)
    assert res.status_code == 200
    data = res.json()
    assert "doctor" in data
    assert "CardioGuard" in data.get("product", "") or "CardioGuard" in str(data)
    assert "disclaimer" in data

    # Test /assistant
    assistant_payload = {
        "message": "Rewrite Summary",
        "interaction": {
            "doctor": "Dr. Robert Smith",
            "hospital": "General Hospital",
            "product": "CardioGuard",
            "sentiment": "Positive",
            "visitDate": "2026-10-20",
            "followUp": "2026-11-03"
        },
        "history": []
    }
    asst_res = client.post("/assistant", json=assistant_payload)
    assert asst_res.status_code == 200
    asst_data = asst_res.json()
    assert "generated" in asst_data or "reply" in asst_data
    assert "disclaimer" in asst_data

def test_export_and_download():
    # Request async CSV export
    exp_res = client.post("/api/reports/export?report_type=interactions")
    assert exp_res.status_code == 200
    exp_data = exp_res.json()
    assert exp_data["status"] == "PROCESSING"
    filename = exp_data["filename"]

    # Give background task a moment
    import time
    time.sleep(1)

    # Download file
    dl_res = client.get(f"/api/reports/download/{filename}")
    assert dl_res.status_code == 200
    assert "text/csv" in dl_res.headers.get("content-type", "")
    content = dl_res.text
    assert "Doctor" in content
    assert "Product" in content
