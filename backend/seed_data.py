import os
import logging
from datetime import datetime, timezone, timedelta
from database import SessionLocal, engine, Base
import models
from auth import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_data")

def seed():
    logger.info("Starting enterprise database seeding...")
    db = SessionLocal()
    try:
        # 1. Territories
        territories_data = [
            {"name": "North-East Region", "code": "TERR-NE-01", "region": "North-East", "description": "New York, Massachusetts, Connecticut, New Jersey"},
            {"name": "Mid-West Region", "code": "TERR-MW-02", "region": "Mid-West", "description": "Illinois, Ohio, Michigan, Minnesota, Indiana"},
            {"name": "West Coast Region", "code": "TERR-WC-03", "region": "West Coast", "description": "California, Washington, Oregon, Nevada"},
            {"name": "South-East Region", "code": "TERR-SE-04", "region": "South-East", "description": "Texas, Florida, Georgia, North Carolina"}
        ]
        territories_map = {}
        for t_info in territories_data:
            existing = db.query(models.Territory).filter(models.Territory.code == t_info["code"]).first()
            if not existing:
                t = models.Territory(**t_info)
                db.add(t)
                db.flush()
                territories_map[t_info["name"]] = t.id
            else:
                territories_map[t_info["name"]] = existing.id

        # 2. Users with Roles
        users_data = [
            {
                "email": "admin@medintelcrm.com",
                "full_name": "Dr. Eleanor Vance",
                "role": "ADMIN",
                "hashed_password": hash_password("AdminPassword123!"),
                "phone": "+1 (555) 019-2831",
                "territory_id": territories_map["North-East Region"]
            },
            {
                "email": "rep1@medintelcrm.com",
                "full_name": "Marcus Reynolds",
                "role": "SALES_REP",
                "hashed_password": hash_password("RepPassword123!"),
                "phone": "+1 (555) 012-4491",
                "territory_id": territories_map["North-East Region"]
            },
            {
                "email": "rep2@medintelcrm.com",
                "full_name": "Sarah Chen",
                "role": "SALES_REP",
                "hashed_password": hash_password("RepPassword123!"),
                "phone": "+1 (555) 014-9923",
                "territory_id": territories_map["Mid-West Region"]
            },
            {
                "email": "rep3@medintelcrm.com",
                "full_name": "David Okafor",
                "role": "SALES_REP",
                "hashed_password": hash_password("RepPassword123!"),
                "phone": "+1 (555) 018-7734",
                "territory_id": territories_map["West Coast Region"]
            },
            {
                "email": "medical.director@medintelcrm.com",
                "full_name": "Dr. Gregory House, MD",
                "role": "MEDICAL_DIRECTOR",
                "hashed_password": hash_password("MedDirector123!"),
                "phone": "+1 (555) 017-3310",
                "territory_id": territories_map["North-East Region"]
            },
            {
                "email": "compliance@medintelcrm.com",
                "full_name": "Helena Torres, JD",
                "role": "COMPLIANCE_OFFICER",
                "hashed_password": hash_password("Compliance123!"),
                "phone": "+1 (555) 015-8821",
                "territory_id": territories_map["North-East Region"]
            }
        ]
        users_map = {}
        for u_info in users_data:
            existing = db.query(models.User).filter(models.User.email == u_info["email"]).first()
            if not existing:
                u = models.User(
                    email=u_info["email"],
                    full_name=u_info["full_name"],
                    role=u_info["role"],
                    hashed_password=u_info["hashed_password"],
                    phone=u_info["phone"],
                    territory_id=u_info["territory_id"],
                    is_active=True
                )
                db.add(u)
                db.flush()
                users_map[u_info["email"]] = u.id
            else:
                users_map[u_info["email"]] = existing.id

        # 3. Healthcare Organizations (HCOs)
        hcos_data = [
            {"name": "Memorial Sloan Kettering Cancer Center", "type": "Hospital", "territory_id": territories_map["North-East Region"], "city": "New York", "state": "NY", "postal_code": "10065", "address": "1275 York Ave", "phone": "+1 (212) 639-2000", "bed_count": 514, "purchasing_tier": "Tier 1", "latitude": 40.7635, "longitude": -73.9575, "operating_hours": "24/7 Emergency & Inpatient"},
            {"name": "Mount Sinai Health System", "type": "Academic Medical Center", "territory_id": territories_map["North-East Region"], "city": "New York", "state": "NY", "postal_code": "10029", "address": "1468 Madison Ave", "phone": "+1 (212) 241-6500", "bed_count": 1134, "purchasing_tier": "Tier 1", "latitude": 40.7900, "longitude": -73.9530, "operating_hours": "24/7 Emergency & Clinic 07:00-19:00"},
            {"name": "Mayo Clinic Hospital", "type": "Hospital", "territory_id": territories_map["Mid-West Region"], "city": "Rochester", "state": "MN", "postal_code": "55905", "address": "1216 2nd St SW", "phone": "+1 (507) 284-2511", "bed_count": 1265, "purchasing_tier": "Tier 1", "latitude": 44.0225, "longitude": -92.4666, "operating_hours": "24/7 Open"},
            {"name": "Cleveland Clinic Main Campus", "type": "Academic Medical Center", "territory_id": territories_map["Mid-West Region"], "city": "Cleveland", "state": "OH", "postal_code": "44195", "address": "9500 Euclid Ave", "phone": "+1 (216) 444-2200", "bed_count": 1400, "purchasing_tier": "Tier 1", "latitude": 41.5034, "longitude": -81.6214, "operating_hours": "24/7 Open"},
            {"name": "Cedars-Sinai Medical Center", "type": "Hospital", "territory_id": territories_map["West Coast Region"], "city": "Los Angeles", "state": "CA", "postal_code": "90048", "address": "8700 Beverly Blvd", "phone": "+1 (310) 423-3277", "bed_count": 886, "purchasing_tier": "Tier 1", "latitude": 34.0760, "longitude": -118.3800, "operating_hours": "24/7 Open"},
            {"name": "Northwestern Memorial Hospital", "type": "Hospital", "territory_id": territories_map["Mid-West Region"], "city": "Chicago", "state": "IL", "postal_code": "60611", "address": "251 E Huron St", "phone": "+1 (312) 926-2000", "bed_count": 894, "purchasing_tier": "Tier 2", "latitude": 41.8948, "longitude": -87.6206, "operating_hours": "24/7 Open"},
            {"name": "MedIntel Express Pharmacy", "type": "Pharmacy", "territory_id": territories_map["North-East Region"], "city": "New York", "state": "NY", "postal_code": "10022", "address": "620 Lexington Ave", "phone": "+1 (212) 555-0199", "bed_count": 0, "purchasing_tier": "Tier 2", "latitude": 40.7592, "longitude": -73.9712, "operating_hours": "Mon-Sat: 08:00 AM - 10:00 PM, Sun: 09:00 AM - 07:00 PM"},
            {"name": "Metropolitan Health Clinic", "type": "Clinic", "territory_id": territories_map["North-East Region"], "city": "New York", "state": "NY", "postal_code": "10021", "address": "345 E 72nd St", "phone": "+1 (212) 555-0144", "bed_count": 25, "purchasing_tier": "Tier 2", "latitude": 40.7684, "longitude": -73.9559, "operating_hours": "Mon-Fri: 08:00 AM - 06:00 PM"},
            {"name": "Premier Community Pharmacy", "type": "Pharmacy", "territory_id": territories_map["North-East Region"], "city": "New York", "state": "NY", "postal_code": "10028", "address": "1530 2nd Ave", "phone": "+1 (212) 555-0188", "bed_count": 0, "purchasing_tier": "Tier 3", "latitude": 40.7738, "longitude": -73.9535, "operating_hours": "Mon-Sat: 08:30 AM - 09:00 PM"},
            {"name": "Downtown Family Medical Clinic", "type": "Clinic", "territory_id": territories_map["North-East Region"], "city": "New York", "state": "NY", "postal_code": "10003", "address": "10 Union Square E", "phone": "+1 (212) 555-0177", "bed_count": 15, "purchasing_tier": "Tier 2", "latitude": 40.7350, "longitude": -73.9900, "operating_hours": "Mon-Fri: 09:00 AM - 05:00 PM"}
        ]
        hcos_map = {}
        for h_info in hcos_data:
            existing = db.query(models.HCO).filter(models.HCO.name == h_info["name"]).first()
            if not existing:
                h = models.HCO(**h_info)
                db.add(h)
                db.flush()
                hcos_map[h_info["name"]] = h.id
            else:
                for k, v in h_info.items():
                    setattr(existing, k, v)
                hcos_map[h_info["name"]] = existing.id

        # 4. Pharmaceutical Products
        products_data = [
            {
                "brand_name": "CardioGuard",
                "generic_name": "Atorvastatin Calcium",
                "ndc_code": "0071-0155-23",
                "category": "Cardiovascular",
                "dosage_form": "Film-Coated Tablet",
                "strength": "20mg",
                "therapeutic_class": "HMG-CoA Reductase Inhibitor",
                "approved_indications": "Indicated as an adjunct to diet to reduce elevated total-C, LDL-C, apo B, and TG levels and to increase HDL-C in adult patients with primary hyperlipidemia.",
                "regulatory_status": "FDA Approved",
                "storage_conditions": "Store at 20°C to 25°C (68°F to 77°F)",
                "package_size": "Bottle of 90 tablets"
            },
            {
                "brand_name": "OncoShield",
                "generic_name": "Pembrolizumab",
                "ndc_code": "0006-3026-02",
                "category": "Oncology",
                "dosage_form": "Intravenous Infusion Solution",
                "strength": "100mg/4mL",
                "therapeutic_class": "Programmed Death Receptor-1 (PD-1) Blocking Antibody",
                "approved_indications": "Indicated for the treatment of patients with unresectable or metastatic melanoma, and first-line treatment of patients with metastatic non-small cell lung cancer (NSCLC) whose tumors have high PD-L1 expression.",
                "regulatory_status": "FDA Approved",
                "storage_conditions": "Store refrigerated at 2°C to 8°C (36°F to 46°F). Do not freeze. Protect from light.",
                "package_size": "Single-dose vial"
            },
            {
                "brand_name": "GlucoFlow",
                "generic_name": "Empagliflozin",
                "ndc_code": "0597-0152-30",
                "category": "Endocrinology",
                "dosage_form": "Oral Tablet",
                "strength": "10mg",
                "therapeutic_class": "Sodium-Glucose Co-Transporter 2 (SGLT2) Inhibitor",
                "approved_indications": "Indicated as an adjunct to diet and exercise to improve glycemic control in adults with type 2 diabetes mellitus, and to reduce the risk of cardiovascular death in adults with type 2 diabetes and established cardiovascular disease.",
                "regulatory_status": "FDA Approved",
                "storage_conditions": "Store at 25°C (77°F); excursions permitted between 15°C and 30°C (59°F and 86°F)",
                "package_size": "Bottle of 30 tablets"
            },
            {
                "brand_name": "NeuroCalm",
                "generic_name": "Duloxetine Hydrochloride",
                "ndc_code": "0002-3240-30",
                "category": "Neurology & Psychiatry",
                "dosage_form": "Delayed-Release Capsule",
                "strength": "30mg",
                "therapeutic_class": "Serotonin and Norepinephrine Reuptake Inhibitor (SNRI)",
                "approved_indications": "Indicated for the treatment of major depressive disorder (MDD), generalized anxiety disorder (GAD), and diabetic peripheral neuropathic pain.",
                "regulatory_status": "FDA Approved",
                "storage_conditions": "Store at 25°C (77°F); excursions permitted to 15°C to 30°C",
                "package_size": "Bottle of 60 capsules"
            },
            {
                "brand_name": "ImmunoPax",
                "generic_name": "Adalimumab",
                "ndc_code": "0074-3799-02",
                "category": "Immunology",
                "dosage_form": "Subcutaneous Injection",
                "strength": "40mg/0.8mL",
                "therapeutic_class": "Tumor Necrosis Factor (TNF) Alpha Blocker",
                "approved_indications": "Indicated for reducing signs and symptoms and inducing major clinical response in adult patients with moderately to severely active rheumatoid arthritis.",
                "regulatory_status": "FDA Approved",
                "storage_conditions": "Refrigerate at 2°C to 8°C (36°F to 46°F). Protect from light.",
                "package_size": "Box of 2 single-dose prefilled syringes"
            }
        ]
        products_map = {}
        for p_info in products_data:
            existing = db.query(models.Product).filter(models.Product.ndc_code == p_info["ndc_code"]).first()
            if not existing:
                p = models.Product(**p_info)
                db.add(p)
                db.flush()
                products_map[p_info["brand_name"]] = p.id
            else:
                products_map[p_info["brand_name"]] = existing.id

        # 5. Healthcare Professionals (HCPs)
        hcps_data = [
            {
                "first_name": "Jonathan",
                "last_name": "Hayes",
                "npi_number": "1942857102",
                "specialty": "Cardiology",
                "hco_id": hcos_map.get("Mount Sinai Health System"),
                "territory_id": territories_map["North-East Region"],
                "assigned_rep_id": users_map.get("rep1@medintelcrm.com"),
                "email": "j.hayes@mountsinai.org",
                "phone": "+1 (212) 555-0143",
                "prescribing_tier": "Tier 1",
                "preferred_channel": "In-Person",
                "relationship_status": "Prescribing Advocate",
                "license_state": "NY",
                "notes": "Chair of Interventional Cardiology. Key opinion leader (KOL). Interested in clinical comparative trial data."
            },
            {
                "first_name": "Arun",
                "last_name": "Patel",
                "npi_number": "1487293019",
                "specialty": "Oncology",
                "hco_id": hcos_map.get("Memorial Sloan Kettering Cancer Center"),
                "territory_id": territories_map["North-East Region"],
                "assigned_rep_id": users_map.get("rep1@medintelcrm.com"),
                "email": "a.patel@mskcc.org",
                "phone": "+1 (212) 555-0199",
                "prescribing_tier": "Tier 1",
                "preferred_channel": "Email",
                "relationship_status": "Active Detailing",
                "license_state": "NY",
                "notes": "Thoracic oncology specialist. Regularly prescribes immunotherapy agents."
            },
            {
                "first_name": "Claire",
                "last_name": "Dubois",
                "npi_number": "1829374011",
                "specialty": "Endocrinology",
                "hco_id": hcos_map.get("Mayo Clinic Hospital"),
                "territory_id": territories_map["Mid-West Region"],
                "assigned_rep_id": users_map.get("rep2@medintelcrm.com"),
                "email": "c.dubois@mayo.edu",
                "phone": "+1 (507) 555-0128",
                "prescribing_tier": "Tier 1",
                "preferred_channel": "In-Person",
                "relationship_status": "Active Detailing",
                "license_state": "MN",
                "notes": "Active researcher in cardiorenal metabolic syndromes."
            },
            {
                "first_name": "Michael",
                "last_name": "Chang",
                "npi_number": "1394857201",
                "specialty": "Neurology",
                "hco_id": hcos_map.get("Cedars-Sinai Medical Center"),
                "territory_id": territories_map["West Coast Region"],
                "assigned_rep_id": users_map.get("rep3@medintelcrm.com"),
                "email": "m.chang@cshs.org",
                "phone": "+1 (310) 555-0176",
                "prescribing_tier": "Tier 2",
                "preferred_channel": "Virtual",
                "relationship_status": "Prospect",
                "license_state": "CA",
                "notes": "Prefers 15-minute scheduled Zoom check-ins with digital monographs."
            },
            {
                "first_name": "Rebecca",
                "last_name": "Alvarez",
                "npi_number": "1728394056",
                "specialty": "Cardiology",
                "hco_id": hcos_map.get("Cleveland Clinic Main Campus"),
                "territory_id": territories_map["Mid-West Region"],
                "assigned_rep_id": users_map.get("rep2@medintelcrm.com"),
                "email": "r.alvarez@ccf.org",
                "phone": "+1 (216) 555-0182",
                "prescribing_tier": "Tier 1",
                "preferred_channel": "In-Person",
                "relationship_status": "Prescribing Advocate",
                "license_state": "OH",
                "notes": "Director of preventive cardiology. Strong advocate for early statin intervention."
            }
        ]
        hcps_map = {}
        for hcp_info in hcps_data:
            existing = db.query(models.HCP).filter(models.HCP.npi_number == hcp_info["npi_number"]).first()
            if not existing:
                h = models.HCP(**hcp_info)
                db.add(h)
                db.flush()
                hcps_map[f"{hcp_info['first_name']} {hcp_info['last_name']}"] = h.id
            else:
                hcps_map[f"{hcp_info['first_name']} {hcp_info['last_name']}"] = existing.id

        # 6. Sample Inventory
        for p_name, p_id in products_map.items():
            existing_inv = db.query(models.SampleInventory).filter(models.SampleInventory.product_id == p_id).first()
            if not existing_inv:
                inv = models.SampleInventory(
                    product_id=p_id,
                    lot_number=f"LOT-2026-{p_id:03d}A",
                    expiration_date="2027-12-31",
                    allocated_rep_id=users_map.get("rep1@medintelcrm.com"),
                    quantity_available=250,
                    quantity_distributed=45
                )
                db.add(inv)

        # 7. Leads Pipeline
        leads_data = [
            {
                "contact_name": "Dr. Angela Washington",
                "organization_name": "Boston Medical Center",
                "email": "a.washington@bmc.org",
                "phone": "+1 (617) 555-0192",
                "specialty": "Cardiology",
                "territory_id": territories_map["North-East Region"],
                "assigned_rep_id": users_map.get("rep1@medintelcrm.com"),
                "stage": "Qualified",
                "lead_score": 85,
                "source": "ACC Cardiology Conference 2026",
                "notes": "Visited our booth at ACC. Requested trial results for CardioGuard vs standard of care."
            },
            {
                "contact_name": "Dr. Kenneth O'Connor",
                "organization_name": "Rush University Medical Center",
                "email": "k.oconnor@rush.edu",
                "phone": "+1 (312) 555-0165",
                "specialty": "Oncology",
                "territory_id": territories_map["Mid-West Region"],
                "assigned_rep_id": users_map.get("rep2@medintelcrm.com"),
                "stage": "Contacted",
                "lead_score": 65,
                "source": "Referral",
                "notes": "Referred by Dr. Dubois. Interested in non-small cell lung cancer trial enrollment."
            },
            {
                "contact_name": "Dr. Priya Nair",
                "organization_name": "UCLA Ronald Reagan Medical Center",
                "email": "p.nair@mednet.ucla.edu",
                "phone": "+1 (310) 555-0144",
                "specialty": "Immunology",
                "territory_id": territories_map["West Coast Region"],
                "assigned_rep_id": users_map.get("rep3@medintelcrm.com"),
                "stage": "Proposal",
                "lead_score": 90,
                "source": "Inbound Web Inquiry",
                "notes": "Requested institutional bulk purchasing quote and scientific liaison detailing."
            }
        ]
        for l_info in leads_data:
            existing = db.query(models.Lead).filter(models.Lead.contact_name == l_info["contact_name"]).first()
            if not existing:
                db.add(models.Lead(**l_info))

        # 8. Campaigns
        campaigns_data = [
            {
                "name": "Q4 CardioGuard Lipid Health Detailing Drive",
                "therapeutic_area": "Cardiovascular",
                "target_specialty": "Cardiology",
                "channel": "In-Person Detailing",
                "start_date": "2026-10-01",
                "end_date": "2026-12-15",
                "budget": 75000.0,
                "status": "Active",
                "target_count": 450,
                "engaged_count": 218,
                "created_by_id": users_map.get("admin@medintelcrm.com")
            },
            {
                "name": "OncoShield First-Line NSCLC Awareness",
                "therapeutic_area": "Oncology",
                "target_specialty": "Oncology",
                "channel": "Webinar & Scientific Exchange",
                "start_date": "2026-09-15",
                "end_date": "2026-11-30",
                "budget": 120000.0,
                "status": "Active",
                "target_count": 300,
                "engaged_count": 185,
                "created_by_id": users_map.get("admin@medintelcrm.com")
            }
        ]
        for c_info in campaigns_data:
            existing = db.query(models.Campaign).filter(models.Campaign.name == c_info["name"]).first()
            if not existing:
                db.add(models.Campaign(**c_info))

        # 9. Tasks & Follow-ups
        now = datetime.now(timezone.utc)
        tasks_data = [
            {
                "title": "Deliver Phase III CardioGuard Monograph to Dr. Jonathan Hayes",
                "description": "Dr. Hayes requested full subgroup analysis on diabetic patients with hyperlipidemia.",
                "due_date": (now + timedelta(days=2)).strftime("%Y-%m-%d"),
                "priority": "High",
                "status": "Pending",
                "assigned_to_id": users_map.get("rep1@medintelcrm.com"),
                "hcp_id": hcps_map.get("Jonathan Hayes")
            },
            {
                "title": "Follow up on sample kit receipt with Dr. Arun Patel",
                "description": "Confirm receipt of OncoShield educational starter kits and patient brochures.",
                "due_date": (now + timedelta(days=4)).strftime("%Y-%m-%d"),
                "priority": "Medium",
                "status": "In_Progress",
                "assigned_to_id": users_map.get("rep1@medintelcrm.com"),
                "hcp_id": hcps_map.get("Arun Patel")
            },
            {
                "title": "Quarterly Formulary Review Meeting with Mayo Clinic Pharmacy Committee",
                "description": "Present GlucoFlow health economics and outcomes research (HEOR) dossier.",
                "due_date": (now + timedelta(days=7)).strftime("%Y-%m-%d"),
                "priority": "High",
                "status": "Pending",
                "assigned_to_id": users_map.get("rep2@medintelcrm.com"),
                "hcp_id": hcps_map.get("Claire Dubois")
            }
        ]
        for t_info in tasks_data:
            existing = db.query(models.Task).filter(models.Task.title == t_info["title"]).first()
            if not existing:
                db.add(models.Task(**t_info))

        # 10. System CRM Configs
        configs = [
            {"key": "compliance_pdma_signature_required", "value": "true", "category": "compliance", "description": "Enforce physical or electronic signature for pharmaceutical samples."},
            {"key": "ai_copilot_model", "value": "llama-3.3-70b-versatile", "category": "ai", "description": "Current default LLM model for extraction and copilot."},
            {"key": "max_samples_per_visit", "value": "10", "category": "compliance", "description": "Maximum sample units permitted to detail per single HCP call report."}
        ]
        for cfg in configs:
            existing = db.query(models.CRMConfig).filter(models.CRMConfig.key == cfg["key"]).first()
            if not existing:
                db.add(models.CRMConfig(**cfg))

        # 11. Sample Prescriptions & Schedules for Authenticated User
        admin_user = db.query(models.User).filter(models.User.email == "admin@medintelcrm.com").first()
        doc_user = db.query(models.User).filter(models.User.email == "medical.director@medintelcrm.com").first()
        cardio_prod = db.query(models.Product).filter(models.Product.brand_name == "CardioGuard").first()
        gluco_prod = db.query(models.Product).filter(models.Product.brand_name == "GlucoFlow").first()
        neuro_prod = db.query(models.Product).filter(models.Product.brand_name == "NeuroCalm").first()

        if admin_user and doc_user:
            prescriptions_data = [
                {
                    "patient_id": admin_user.id,
                    "prescriber_id": doc_user.id,
                    "product_id": cardio_prod.id if cardio_prod else None,
                    "medicine_name": "CardioGuard",
                    "generic_name": "Atorvastatin Calcium",
                    "strength": "20mg",
                    "dosage_quantity": 1.0,
                    "dosage_unit": "Tablet",
                    "frequency": "Once Daily",
                    "scheduled_times": ["Morning"],
                    "start_date": (now - timedelta(days=7)).date(),
                    "end_date": (now + timedelta(days=60)).date(),
                    "food_instruction": "After Food",
                    "instructions": "Take 1 tablet every morning with water after breakfast.",
                    "status": "Active"
                },
                {
                    "patient_id": admin_user.id,
                    "prescriber_id": doc_user.id,
                    "product_id": gluco_prod.id if gluco_prod else None,
                    "medicine_name": "GlucoFlow",
                    "generic_name": "Empagliflozin",
                    "strength": "10mg",
                    "dosage_quantity": 1.0,
                    "dosage_unit": "Tablet",
                    "frequency": "Twice Daily",
                    "scheduled_times": ["Morning", "Evening"],
                    "start_date": (now - timedelta(days=7)).date(),
                    "end_date": (now + timedelta(days=30)).date(),
                    "food_instruction": "With Food",
                    "instructions": "Take with morning and evening meals.",
                    "status": "Active"
                },
                {
                    "patient_id": admin_user.id,
                    "prescriber_id": doc_user.id,
                    "product_id": neuro_prod.id if neuro_prod else None,
                    "medicine_name": "NeuroCalm",
                    "generic_name": "Duloxetine HCl",
                    "strength": "30mg",
                    "dosage_quantity": 1.0,
                    "dosage_unit": "Capsule",
                    "frequency": "Once Daily",
                    "scheduled_times": ["Night"],
                    "start_date": (now - timedelta(days=7)).date(),
                    "end_date": (now + timedelta(days=45)).date(),
                    "food_instruction": "Before Sleep",
                    "instructions": "Take at night before sleep. Do not consume alcohol.",
                    "status": "Active"
                }
            ]

            today = now.date()
            for p_data in prescriptions_data:
                p_existing = db.query(models.Prescription).filter(
                    models.Prescription.patient_id == p_data["patient_id"],
                    models.Prescription.medicine_name == p_data["medicine_name"]
                ).first()
                if not p_existing:
                    p = models.Prescription(**p_data)
                    db.add(p)
                    db.flush()
                    p_id = p.id
                else:
                    p_id = p_existing.id

                # Generate dose schedule logs for today
                slot_times = {
                    "Morning": "08:00",
                    "Afternoon": "13:00",
                    "Evening": "18:00",
                    "Night": "21:00"
                }
                for slot in p_data["scheduled_times"]:
                    log_existing = db.query(models.MedicationScheduleLog).filter(
                        models.MedicationScheduleLog.prescription_id == p_id,
                        models.MedicationScheduleLog.scheduled_date == today,
                        models.MedicationScheduleLog.scheduled_slot == slot
                    ).first()
                    if not log_existing:
                        db.add(models.MedicationScheduleLog(
                            prescription_id=p_id,
                            user_id=admin_user.id,
                            scheduled_date=today,
                            scheduled_slot=slot,
                            scheduled_time=slot_times.get(slot, "08:00"),
                            status="Scheduled",
                            is_verified=False
                        ))

        # 12. Initial Audit Log
        existing_log = db.query(models.AuditLog).first()
        if not existing_log:
            db.add(models.AuditLog(
                actor_email="system@medintelcrm.com",
                action="SYSTEM_INIT",
                entity_type="SYSTEM",
                entity_id="0",
                details="Enterprise database initialization and baseline data seeding completed successfully.",
                ip_address="127.0.0.1",
                timestamp=now
            ))

        db.commit()
        logger.info("Enterprise database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        logger.error("Error during database seeding: %s", e)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed()
