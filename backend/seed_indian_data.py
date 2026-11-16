import os
import logging
from datetime import datetime, timezone, timedelta, date
from database import SessionLocal, engine, Base
import models
from auth import hash_password

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_indian_data")

def seed_india():
    logger.info("Seeding Indian Healthcare Ecosystem data...")
    db = SessionLocal()
    try:
        # 1. Indian Territories
        territories_data = [
            {"name": "Southern Region - Karnataka & Bengaluru", "code": "TERR-IN-KA", "region": "South India", "description": "Bengaluru, Mysuru, Hubballi, Mangaluru"},
            {"name": "Western Region - Maharashtra & Mumbai", "code": "TERR-IN-MH", "region": "West India", "description": "Mumbai, Pune, Nagpur, Nashik"},
            {"name": "Northern Region - Delhi NCR & UP", "code": "TERR-IN-DL", "region": "North India", "description": "New Delhi, Noida, Gurugram, Lucknow"},
            {"name": "Eastern Region - West Bengal & Kolkata", "code": "TERR-IN-WB", "region": "East India", "description": "Kolkata, Howrah, Siliguri, Asansol"}
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

        default_terr_id = territories_map["Southern Region - Karnataka & Bengaluru"]

        # 2. Indian Users (Patient, Doctor, Pharmacist, Rep, Admin)
        users_data = [
            {
                "email": "admin@medintelcrm.com",
                "full_name": "Dr. Eleanor Vance (Dr. Ananya Iyer)",
                "role": "ADMIN",
                "hashed_password": hash_password("AdminPassword123!"),
                "phone": "+91 99000 11223",
                "territory_id": default_terr_id,
                "city_town": "Bengaluru",
                "state_or_ut": "Karnataka",
                "pin_code": "560001"
            },
            {
                "email": "medical.director@medintelcrm.com",
                "full_name": "Dr. Gregory House, MBBS, MD",
                "role": "MEDICAL_DIRECTOR",
                "hashed_password": hash_password("MedDirector123!"),
                "phone": "+91 98200 54321",
                "territory_id": default_terr_id,
                "medical_council_reg_no": "KMC-45892",
                "medical_council_name": "Karnataka Medical Council",
                "doctor_qualifications": "MBBS, MD (General Medicine)",
                "doctor_specialty": "Internal Medicine & Clinical Detailing",
                "city_town": "Bengaluru",
                "district": "Bengaluru Urban",
                "state_or_ut": "Karnataka",
                "pin_code": "560001"
            },
            {
                "email": "patient.john@example.com",
                "full_name": "Johnathan Doe (Rohan Sharma)",
                "role": "PATIENT",
                "hashed_password": hash_password("PatientPassword123!"),
                "phone": "+91 98450 12345",
                "territory_id": default_terr_id,
                "abha_number": "91-4589-2041-8891",
                "abha_address": "rohan.sharma@abdm",
                "house_flat_no": "Flat 302, Palm Heights",
                "street_name": "100 Feet Road",
                "locality_area": "Indiranagar",
                "city_town": "Bengaluru",
                "district": "Bengaluru Urban",
                "state_or_ut": "Karnataka",
                "pin_code": "560038",
                "date_of_birth": "1988-06-15",
                "gender": "Male",
                "blood_group": "O+",
                "weight_kg": 68.5,
                "height_cm": 172.0
            },
            {
                "email": "pharmacist.mike@example.com",
                "full_name": "Mike Sterling, RPh (Rajesh Verma)",
                "role": "PHARMACIST",
                "hashed_password": hash_password("PharmacistPassword123!"),
                "phone": "+91 97410 88990",
                "territory_id": default_terr_id,
                "pharmacist_reg_no": "KA-PH-2024-998",
                "state_pharmacy_council": "Karnataka State Pharmacy Council",
                "pharmacy_license_no_20": "KA-BLR-20-8849",
                "pharmacy_license_no_21": "KA-BLR-21-8850",
                "locality_area": "Indiranagar",
                "city_town": "Bengaluru",
                "district": "Bengaluru Urban",
                "state_or_ut": "Karnataka",
                "pin_code": "560038"
            },
            {
                "email": "rep1@medintelcrm.com",
                "full_name": "Marcus Reynolds (Vikram Malhotra)",
                "role": "SALES_REP",
                "hashed_password": hash_password("RepPassword123!"),
                "phone": "+91 98111 22334",
                "territory_id": default_terr_id,
                "city_town": "Bengaluru",
                "state_or_ut": "Karnataka",
                "pin_code": "560001"
            }
        ]

        users_map = {}
        for u_info in users_data:
            existing = db.query(models.User).filter(models.User.email == u_info["email"]).first()
            if not existing:
                u = models.User(**u_info, is_active=True)
                db.add(u)
                db.flush()
                users_map[u_info["email"]] = u.id
            else:
                for k, v in u_info.items():
                    setattr(existing, k, v)
                db.flush()
                users_map[u_info["email"]] = existing.id

        # 3. Indian Healthcare Organizations (HCOs)
        hcos_data = [
            {
                "name": "MedPlus Pharmacy & Chemist",
                "type": "Pharmacy",
                "facility_category": "Chemist / Retail Pharmacy",
                "territory_id": default_terr_id,
                "address": "#42, 100ft Road, HAL 2nd Stage",
                "locality_area": "Indiranagar",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "postal_code": "560038",
                "pin_code": "560038",
                "phone": "+91 80 2521 8844",
                "latitude": 12.9719,
                "longitude": 77.6412,
                "operating_hours": "07:30 AM - 11:00 PM (All Days)",
                "drug_license_no_20": "KA-BLR-20-8849",
                "drug_license_no_21": "KA-BLR-21-8850",
                "is_verified": True
            },
            {
                "name": "Apollo Pharmacy 24x7",
                "type": "Pharmacy",
                "facility_category": "Chemist / Retail Pharmacy",
                "territory_id": default_terr_id,
                "address": "#88, 5th Block",
                "locality_area": "Koramangala",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "postal_code": "560034",
                "pin_code": "560034",
                "phone": "+91 80 2553 1122",
                "latitude": 12.9352,
                "longitude": 77.6245,
                "operating_hours": "24/7 Open",
                "drug_license_no_20": "KA-BLR-20-9912",
                "drug_license_no_21": "KA-BLR-21-9913",
                "is_verified": True
            },
            {
                "name": "Pradhan Mantri Bharatiya Janaushadhi Kendra (PMBJK)",
                "type": "Pharmacy",
                "facility_category": "Jan Aushadhi Kendra",
                "territory_id": default_terr_id,
                "address": "#12, 4th Block, 11th Main",
                "locality_area": "Jayanagar",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "postal_code": "560011",
                "pin_code": "560011",
                "phone": "+91 80 2665 4400",
                "latitude": 12.9308,
                "longitude": 77.5838,
                "operating_hours": "09:00 AM - 09:00 PM (Mon-Sat)",
                "drug_license_no_20": "KA-BLR-20-PMBJK",
                "drug_license_no_21": "KA-BLR-21-PMBJK",
                "is_verified": True
            },
            {
                "name": "Manipal Hospital",
                "type": "Hospital",
                "facility_category": "Multi-Speciality Hospital",
                "territory_id": default_terr_id,
                "address": "#98, HAL Old Airport Road",
                "locality_area": "Kodihalli",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "postal_code": "560017",
                "pin_code": "560017",
                "phone": "+91 80 2502 4444",
                "bed_count": 600,
                "latitude": 12.9592,
                "longitude": 77.6534,
                "operating_hours": "24/7 Emergency & Inpatient",
                "is_verified": True
            },
            {
                "name": "Apollo Hospital",
                "type": "Hospital",
                "facility_category": "Multi-Speciality Hospital",
                "territory_id": default_terr_id,
                "address": "154/11, Bannerghatta Main Road",
                "locality_area": "IIMB Post",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "postal_code": "560076",
                "pin_code": "560076",
                "phone": "+91 80 2630 4050",
                "bed_count": 250,
                "latitude": 12.8930,
                "longitude": 77.5980,
                "operating_hours": "24/7 Emergency & Inpatient",
                "is_verified": True
            },
            {
                "name": "Dr. Swaminathan Family Polyclinic",
                "type": "Clinic",
                "facility_category": "Polyclinic & Daycare",
                "territory_id": default_terr_id,
                "address": "#15, CMH Road",
                "locality_area": "Indiranagar",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "postal_code": "560038",
                "pin_code": "560038",
                "phone": "+91 80 2520 9988",
                "bed_count": 10,
                "latitude": 12.9780,
                "longitude": 77.6400,
                "operating_hours": "08:30 AM - 08:00 PM (Mon-Sat)",
                "is_verified": True
            },
            {
                "name": "Anand Diagnostic Laboratory & SRL Pathlab",
                "type": "Clinic",
                "facility_category": "Diagnostic Lab & Pathology",
                "territory_id": default_terr_id,
                "address": "#54, Bowring Hospital Road",
                "locality_area": "Shivajinagar",
                "city": "Bengaluru",
                "district": "Bengaluru Urban",
                "state": "Karnataka",
                "postal_code": "560001",
                "pin_code": "560001",
                "phone": "+91 80 2286 1100",
                "bed_count": 0,
                "latitude": 12.9810,
                "longitude": 77.6050,
                "operating_hours": "06:30 AM - 09:00 PM (All Days)",
                "is_verified": True
            }
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
                db.flush()
                hcos_map[h_info["name"]] = existing.id

        # 4. Indian Medicine Products
        products_data = [
            {
                "brand_name": "Dolo 650",
                "generic_name": "PARACETAMOL",
                "ndc_code": "IN-DOLO-650",
                "category": "Antipyretic & Analgesic",
                "dosage_form": "Tablet",
                "strength": "650mg",
                "therapeutic_class": "Analgesic & Antipyretic",
                "manufacturer": "Micro Labs Ltd",
                "approved_indications": "Relief of mild to moderate fever and bodily pain, headaches, and joint aches.",
                "regulatory_status": "CDSCO Approved",
                "schedule_category": "OTC",
                "mrp_inr": 33.60,
                "ptr_inr": 25.20,
                "gst_percentage": 12.0,
                "barcode_gtin": "8901117006501",
                "storage_conditions": "Store below 30°C in a dry place. Protect from moisture.",
                "package_size": "Strip of 15 tablets"
            },
            {
                "brand_name": "Augmentin 625 Duo",
                "generic_name": "AMOXICILLIN + CLAVULANIC ACID",
                "ndc_code": "IN-AUG-625",
                "category": "Antibiotic",
                "dosage_form": "Film-Coated Tablet",
                "strength": "625mg (500mg+125mg)",
                "therapeutic_class": "Beta-lactam Antibacterial",
                "manufacturer": "GlaxoSmithKline Pharmaceuticals India",
                "approved_indications": "Treatment of acute bacterial sinusitis, respiratory tract infections, and skin infections.",
                "regulatory_status": "CDSCO Approved",
                "schedule_category": "Schedule H1",
                "mrp_inr": 204.50,
                "ptr_inr": 155.00,
                "gst_percentage": 12.0,
                "barcode_gtin": "8901036062502",
                "storage_conditions": "Store below 25°C. Protect from moisture and heat.",
                "package_size": "Strip of 10 tablets"
            },
            {
                "brand_name": "Atorva 20",
                "generic_name": "ATORVASTATIN",
                "ndc_code": "IN-ATV-020",
                "category": "Cardiovascular",
                "dosage_form": "Tablet",
                "strength": "20mg",
                "therapeutic_class": "HMG-CoA Reductase Inhibitor",
                "manufacturer": "Zydus Lifesciences Ltd",
                "approved_indications": "Hypercholesterolemia and prevention of cardiovascular events in adult patients.",
                "regulatory_status": "CDSCO Approved",
                "schedule_category": "Schedule H",
                "mrp_inr": 245.00,
                "ptr_inr": 185.00,
                "gst_percentage": 12.0,
                "barcode_gtin": "8901235020012",
                "storage_conditions": "Store below 30°C. Protect from direct sunlight.",
                "package_size": "Strip of 15 tablets"
            },
            {
                "brand_name": "Glycomet 500",
                "generic_name": "METFORMIN HYDROCHLORIDE",
                "ndc_code": "IN-GLY-500",
                "category": "Endocrinology",
                "dosage_form": "Extended-Release Tablet",
                "strength": "500mg",
                "therapeutic_class": "Biguanide Antidiabetic",
                "manufacturer": "USV Pvt Ltd",
                "approved_indications": "Glycemic management in adult patients with Type 2 Diabetes Mellitus.",
                "regulatory_status": "CDSCO Approved",
                "schedule_category": "Schedule H",
                "mrp_inr": 42.00,
                "ptr_inr": 31.50,
                "gst_percentage": 12.0,
                "barcode_gtin": "8901111050011",
                "storage_conditions": "Store at room temperature below 30°C.",
                "package_size": "Strip of 20 tablets"
            },
            {
                "brand_name": "Pan 40",
                "generic_name": "PANTOPRAZOLE SODIUM",
                "ndc_code": "IN-PAN-040",
                "category": "Gastroenterology",
                "dosage_form": "Gastro-Resistant Tablet",
                "strength": "40mg",
                "therapeutic_class": "Proton Pump Inhibitor (PPI)",
                "manufacturer": "Alkem Laboratories Ltd",
                "approved_indications": "Gastroesophageal reflux disease (GERD), acid peptic disorders and erosive esophagitis.",
                "regulatory_status": "CDSCO Approved",
                "schedule_category": "Schedule H",
                "mrp_inr": 155.00,
                "ptr_inr": 116.00,
                "gst_percentage": 12.0,
                "barcode_gtin": "8901108004018",
                "storage_conditions": "Store below 25°C. Protect from moisture.",
                "package_size": "Strip of 15 tablets"
            },
            {
                "brand_name": "Azithral 500",
                "generic_name": "AZITHROMYCIN",
                "ndc_code": "IN-AZI-500",
                "category": "Antibiotic",
                "dosage_form": "Tablet",
                "strength": "500mg",
                "therapeutic_class": "Macrolide Antibacterial",
                "manufacturer": "Alembic Pharmaceuticals Ltd",
                "approved_indications": "Upper and lower respiratory tract infections, tonsillitis, and pharyngitis.",
                "regulatory_status": "CDSCO Approved",
                "schedule_category": "Schedule H1",
                "mrp_inr": 132.00,
                "ptr_inr": 99.00,
                "gst_percentage": 12.0,
                "barcode_gtin": "8901123005012",
                "storage_conditions": "Store below 30°C in a dry place.",
                "package_size": "Strip of 5 tablets"
            },
            {
                "brand_name": "Telma 40",
                "generic_name": "TELMISARTAN",
                "ndc_code": "IN-TEL-040",
                "category": "Cardiovascular",
                "dosage_form": "Tablet",
                "strength": "40mg",
                "therapeutic_class": "Angiotensin II Receptor Antagonist (ARB)",
                "manufacturer": "Glenmark Pharmaceuticals Ltd",
                "approved_indications": "Essential hypertension and cardiovascular morbidity reduction.",
                "regulatory_status": "CDSCO Approved",
                "schedule_category": "Schedule H",
                "mrp_inr": 278.00,
                "ptr_inr": 208.50,
                "gst_percentage": 12.0,
                "barcode_gtin": "8901148004019",
                "storage_conditions": "Store in moisture-proof container below 30°C.",
                "package_size": "Strip of 30 tablets"
            }
        ]

        products_map = {}
        for p_info in products_data:
            existing = db.query(models.Product).filter(models.Product.brand_name == p_info["brand_name"]).first()
            if not existing:
                p = models.Product(**p_info)
                db.add(p)
                db.flush()
                products_map[p_info["brand_name"]] = p.id
            else:
                for k, v in p_info.items():
                    setattr(existing, k, v)
                db.flush()
                products_map[p_info["brand_name"]] = existing.id

        # 5. Seed Retail Inventory for "MedPlus Pharmacy & Chemist"
        medplus_id = hcos_map["MedPlus Pharmacy & Chemist"]
        inventory_data = [
            {"medicine_name": "Dolo 650", "generic_name": "PARACETAMOL", "strength": "650mg", "dosage_form": "Tablet", "schedule_category": "OTC", "stock_quantity": 250, "reorder_level": 40, "unit_price": 25.20, "mrp_inr": 33.60, "lot_number": "IN-DOLO-992", "mfg_date": "2024-03-01", "expiry_date": "2027-02-28", "status": "In Stock"},
            {"medicine_name": "Augmentin 625 Duo", "generic_name": "AMOXICILLIN + CLAVULANIC ACID", "strength": "625mg", "dosage_form": "Tablet", "schedule_category": "Schedule H1", "stock_quantity": 85, "reorder_level": 25, "unit_price": 155.00, "mrp_inr": 204.50, "lot_number": "IN-AUG-2024", "mfg_date": "2024-05-10", "expiry_date": "2026-11-30", "status": "In Stock"},
            {"medicine_name": "Pan 40", "generic_name": "PANTOPRAZOLE SODIUM", "strength": "40mg", "dosage_form": "Tablet", "schedule_category": "Schedule H", "stock_quantity": 120, "reorder_level": 30, "unit_price": 116.00, "mrp_inr": 155.00, "lot_number": "IN-PAN-441", "mfg_date": "2024-04-15", "expiry_date": "2027-03-31", "status": "In Stock"},
            {"medicine_name": "Atorva 20", "generic_name": "ATORVASTATIN", "strength": "20mg", "dosage_form": "Tablet", "schedule_category": "Schedule H", "stock_quantity": 60, "reorder_level": 20, "unit_price": 185.00, "mrp_inr": 245.00, "lot_number": "IN-ATV-102", "mfg_date": "2024-02-01", "expiry_date": "2026-12-31", "status": "In Stock"},
            {"medicine_name": "Azithral 500", "generic_name": "AZITHROMYCIN", "strength": "500mg", "dosage_form": "Tablet", "schedule_category": "Schedule H1", "stock_quantity": 15, "reorder_level": 20, "unit_price": 99.00, "mrp_inr": 132.00, "lot_number": "IN-AZI-880", "mfg_date": "2024-06-01", "expiry_date": "2026-08-31", "status": "Low Stock"}
        ]

        for inv in inventory_data:
            existing = db.query(models.PharmacyInventory).filter(
                models.PharmacyInventory.hco_id == medplus_id,
                models.PharmacyInventory.medicine_name == inv["medicine_name"]
            ).first()
            if not existing:
                item = models.PharmacyInventory(hco_id=medplus_id, **inv)
                db.add(item)
            else:
                for k, v in inv.items():
                    setattr(existing, k, v)
        db.flush()

        # 6. Seed Indian Prescriptions for Johnathan Doe (Patient)
        pat_id = users_map["patient.john@example.com"]
        doc_id = users_map["medical.director@medintelcrm.com"]
        today_val = date.today()

        prescriptions_to_seed = [
            {
                "patient_id": pat_id,
                "prescriber_id": doc_id,
                "medicine_name": "Augmentin 625 Duo",
                "generic_name": "AMOXICILLIN + CLAVULANIC ACID",
                "strength": "625mg",
                "dosage_quantity": 1.0,
                "dosage_unit": "Tablet",
                "frequency": "Twice Daily",
                "frequency_indian": "Twice Daily (BD / 1-0-1)",
                "scheduled_times": ["Morning", "Night"],
                "start_date": today_val,
                "end_date": today_val + timedelta(days=5),
                "food_instruction": "After Food",
                "instructions": "Take with water after breakfast and dinner. Complete entire 5-day antibiotic course.",
                "instructions_vernacular": "भोजन के बाद पानी के साथ लें। 5 दिन का पूरा कोर्स अवश्य समाप्त करें।",
                "schedule_category": "Schedule H1",
                "duration_days": 5,
                "doctor_registration_no": "KMC-45892",
                "status": "Active"
            },
            {
                "patient_id": pat_id,
                "prescriber_id": doc_id,
                "medicine_name": "Pan 40",
                "generic_name": "PANTOPRAZOLE SODIUM",
                "strength": "40mg",
                "dosage_quantity": 1.0,
                "dosage_unit": "Tablet",
                "frequency": "Once Daily",
                "frequency_indian": "Once Daily (OD / 1-0-0)",
                "scheduled_times": ["Morning"],
                "start_date": today_val,
                "end_date": today_val + timedelta(days=14),
                "food_instruction": "Before Food",
                "instructions": "Take empty stomach in the morning 30 minutes before breakfast.",
                "instructions_vernacular": "सुबह नाश्ते से 30 मिनट पहले खाली पेट लें।",
                "schedule_category": "Schedule H",
                "duration_days": 14,
                "doctor_registration_no": "KMC-45892",
                "status": "Active"
            },
            {
                "patient_id": pat_id,
                "prescriber_id": doc_id,
                "medicine_name": "Dolo 650",
                "generic_name": "PARACETAMOL",
                "strength": "650mg",
                "dosage_quantity": 1.0,
                "dosage_unit": "Tablet",
                "frequency": "As Needed (SOS)",
                "frequency_indian": "SOS (जरूरत पड़ने पर)",
                "scheduled_times": ["Afternoon", "Night"],
                "start_date": today_val,
                "end_date": today_val + timedelta(days=3),
                "food_instruction": "After Food",
                "instructions": "Take only if body temperature exceeds 37.5°C or for headache.",
                "instructions_vernacular": "केवल बुखार या सिरदर्द होने पर भोजन के बाद लें।",
                "schedule_category": "OTC",
                "duration_days": 3,
                "doctor_registration_no": "KMC-45892",
                "status": "Active"
            }
        ]

        for p_data in prescriptions_to_seed:
            existing = db.query(models.Prescription).filter(
                models.Prescription.patient_id == pat_id,
                models.Prescription.medicine_name == p_data["medicine_name"]
            ).first()
            if not existing:
                p = models.Prescription(**p_data)
                db.add(p)
                db.flush()
                # Create schedule logs for today
                for slot in p_data["scheduled_times"]:
                    sched_time = "08:00" if slot == "Morning" else ("13:30" if slot == "Afternoon" else ("19:00" if slot == "Evening" else "21:30"))
                    log = models.MedicationScheduleLog(
                        prescription_id=p.id,
                        user_id=pat_id,
                        scheduled_date=today_val,
                        scheduled_slot=slot,
                        scheduled_time=sched_time,
                        status="Scheduled"
                    )
                    db.add(log)
            else:
                for k, v in p_data.items():
                    setattr(existing, k, v)
                db.flush()

        # 7. Seed Indian Outpatient Consultation Appointment
        appt = db.query(models.Appointment).filter(models.Appointment.patient_id == pat_id).first()
        if not appt:
            new_appt = models.Appointment(
                patient_id=pat_id,
                doctor_id=doc_id,
                appointment_date=today_val + timedelta(days=1),
                slot_time="10:30 AM",
                appointment_type="In-Person",
                consultation_mode="OPD In-Person",
                consultation_fee_inr=500.0,
                patient_language="Kannada",
                reason="Follow-up consultation for seasonal pyrexia and sore throat",
                status="Confirmed",
                clinical_notes="Vitals stable. Temperature 37.1°C. Prescribed Augmentin 625 Duo for 5 days.",
                diagnosis="Acute Bacterial Pharyngitis (ICD-10 J02.9)"
            )
            db.add(new_appt)

        # 8. Seed Indian Diagnostic Medical Report with Indian Clinical Units
        report = db.query(models.MedicalReport).filter(models.MedicalReport.patient_id == pat_id).first()
        if not report:
            new_rep = models.MedicalReport(
                patient_id=pat_id,
                title="Complete Blood Count (CBC) & Fasting Blood Glucose",
                report_type="Lab Test",
                test_category="Hematology & Biochemistry",
                report_date=today_val - timedelta(days=2),
                file_url="https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=600",
                file_name="AnandLab_CBC_FBS_RohanSharma.pdf",
                file_size_kb=420.5,
                biomarkers={
                    "hemoglobin": {"value": 14.2, "unit": "g/dL", "ref": "13.0 - 17.0"},
                    "total_wbc": {"value": 8400, "unit": "cells/mcL", "ref": "4000 - 11000"},
                    "platelets": {"value": 2.4, "unit": "lakhs/mcL", "ref": "1.5 - 4.5"},
                    "fasting_glucose": {"value": 94, "unit": "mg/dL", "ref": "70 - 99"},
                    "blood_pressure": {"systolic": 122, "diastolic": 80, "unit": "mmHg"}
                },
                clinical_observations="Platelet count and hemoglobin are normal. Fasting blood sugar within normal non-diabetic range (94 mg/dL). Vitals normal.",
                status="Reviewed",
                reviewed_by_id=doc_id,
                reviewed_at=datetime.now(timezone.utc)
            )
            db.add(new_rep)

        db.commit()
        logger.info("Indian Healthcare Ecosystem database seeding completed successfully!")
    except Exception as e:
        db.rollback()
        logger.error("Seeding failed: %s", e)
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_india()

