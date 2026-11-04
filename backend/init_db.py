import logging
from sqlalchemy import text
from database import engine, Base
import models

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("init_db")

def migrate_and_sync():
    logger.info("Synchronizing database schema...")
    
    # 1. Create all newly defined tables
    Base.metadata.create_all(bind=engine)
    logger.info("Base metadata created.")

    # 2. Add columns to interactions if not already present (non-destructive)
    with engine.connect() as conn:
        alter_statements = [
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;",
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS hcp_id INTEGER REFERENCES hcps(id) ON DELETE SET NULL;",
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS hco_id INTEGER REFERENCES hcos(id) ON DELETE SET NULL;",
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;",
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Completed';",
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            "ALTER TABLE interactions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;",
            # Indexes for high performance
            "CREATE INDEX IF NOT EXISTS idx_interactions_visit_date ON interactions(\"visitDate\");",
            "CREATE INDEX IF NOT EXISTS idx_interactions_doctor ON interactions(doctor);",
            "CREATE INDEX IF NOT EXISTS idx_interactions_product ON interactions(product);",
            # HCO Geolocation & Operating Hours
            "ALTER TABLE hcos ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;",
            "ALTER TABLE hcos ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;",
            "ALTER TABLE hcos ADD COLUMN IF NOT EXISTS operating_hours VARCHAR(255) DEFAULT 'Mon-Sat: 08:00 AM - 08:00 PM';",
            "ALTER TABLE hcos ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE;",
            "ALTER TABLE hcos ADD COLUMN IF NOT EXISTS facility_category VARCHAR(100) DEFAULT 'Hospital';",
            "ALTER TABLE hcos ADD COLUMN IF NOT EXISTS locality_area VARCHAR(255);",
            "ALTER TABLE hcos ADD COLUMN IF NOT EXISTS district VARCHAR(100);",
            "ALTER TABLE hcos ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10);",
            "ALTER TABLE hcos ADD COLUMN IF NOT EXISTS drug_license_no_20 VARCHAR(100);",
            "ALTER TABLE hcos ADD COLUMN IF NOT EXISTS drug_license_no_21 VARCHAR(100);",
            "CREATE INDEX IF NOT EXISTS idx_hcos_lat_lng ON hcos(latitude, longitude);",

            # User Indian Healthcare Extensions
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS abha_number VARCHAR(50);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS abha_address VARCHAR(100);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS house_flat_no VARCHAR(100);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS street_name VARCHAR(255);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS locality_area VARCHAR(255);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS city_town VARCHAR(100);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS district VARCHAR(100);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS state_or_ut VARCHAR(100);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_code VARCHAR(10);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth VARCHAR(20);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS weight_kg DOUBLE PRECISION;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS height_cm DOUBLE PRECISION;",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_council_reg_no VARCHAR(100);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS medical_council_name VARCHAR(150);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_qualifications VARCHAR(255);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS doctor_specialty VARCHAR(100);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS pharmacist_reg_no VARCHAR(100);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS state_pharmacy_council VARCHAR(150);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS pharmacy_license_no_20 VARCHAR(100);",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS pharmacy_license_no_21 VARCHAR(100);",

            # HCP Indian Council & Qualifications
            "ALTER TABLE hcps ADD COLUMN IF NOT EXISTS medical_council_reg_no VARCHAR(100);",
            "ALTER TABLE hcps ADD COLUMN IF NOT EXISTS medical_council_name VARCHAR(150) DEFAULT 'State Medical Council';",
            "ALTER TABLE hcps ADD COLUMN IF NOT EXISTS qualifications VARCHAR(255) DEFAULT 'MBBS';",
            "ALTER TABLE hcps ADD COLUMN IF NOT EXISTS consultation_fee_inr DOUBLE PRECISION DEFAULT 500.0;",

            # Products Indian Schedule & Pricing
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS schedule_category VARCHAR(50) DEFAULT 'Schedule H';",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS mrp_inr DOUBLE PRECISION DEFAULT 100.0;",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS ptr_inr DOUBLE PRECISION DEFAULT 75.0;",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS gst_percentage DOUBLE PRECISION DEFAULT 12.0;",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode_gtin VARCHAR(100);",
            "ALTER TABLE products ADD COLUMN IF NOT EXISTS cdsco_approved BOOLEAN DEFAULT TRUE;",

            # Prescriptions Indian Regimen & Doctor Stamp
            "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS schedule_category VARCHAR(50) DEFAULT 'Schedule H';",
            "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS route VARCHAR(50) DEFAULT 'Oral';",
            "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS frequency_indian VARCHAR(50) DEFAULT 'Once Daily (OD)';",
            "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS duration_days INTEGER DEFAULT 5;",
            "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS doctor_registration_no VARCHAR(100);",
            "ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS instructions_vernacular VARCHAR(500);",

            # Appointments Indian Consultation Modes & Languages
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_mode VARCHAR(50) DEFAULT 'OPD In-Person';",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS consultation_fee_inr DOUBLE PRECISION DEFAULT 500.0;",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_language VARCHAR(50) DEFAULT 'English';",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS transcript_original TEXT;",
            "ALTER TABLE appointments ADD COLUMN IF NOT EXISTS clinical_summary_english TEXT;",

            # Pharmacy Orders Schedule & Dispensing
            "ALTER TABLE pharmacy_orders ADD COLUMN IF NOT EXISTS schedule_category VARCHAR(50) DEFAULT 'Schedule H';",
            "ALTER TABLE pharmacy_orders ADD COLUMN IF NOT EXISTS total_amount_inr DOUBLE PRECISION DEFAULT 0.0;",
            "ALTER TABLE pharmacy_orders ADD COLUMN IF NOT EXISTS dispensed_pharmacist_reg_no VARCHAR(100);",
            "ALTER TABLE pharmacy_orders ADD COLUMN IF NOT EXISTS h1_register_logged BOOLEAN DEFAULT FALSE;",

            # Medical Reports Biomarkers
            "ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS test_category VARCHAR(100) DEFAULT 'General Diagnostic';",
            "ALTER TABLE medical_reports ADD COLUMN IF NOT EXISTS biomarkers JSON;",

            # Pharmacy Inventory MRP & Schedule
            "ALTER TABLE pharmacy_inventory ADD COLUMN IF NOT EXISTS mrp_inr DOUBLE PRECISION DEFAULT 50.0;",
            "ALTER TABLE pharmacy_inventory ADD COLUMN IF NOT EXISTS schedule_category VARCHAR(50) DEFAULT 'Schedule H';",
            "ALTER TABLE pharmacy_inventory ADD COLUMN IF NOT EXISTS mfg_date VARCHAR(50);"
        ]
        for stmt in alter_statements:
            try:
                conn.execute(text(stmt))
            except Exception as e:
                logger.warning("Migration statement warning: %s -> %s", stmt, e)
        conn.commit()
    logger.info("Database schema synchronization complete.")

if __name__ == "__main__":
    migrate_and_sync()
