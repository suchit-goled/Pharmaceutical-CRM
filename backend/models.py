from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Index, Date, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Interaction(Base):
    __tablename__ = "interactions"

    # Core original fields (preserved for 100% backward compatibility)
    id = Column(Integer, primary_key=True, index=True)
    doctor = Column(String, index=True)
    hospital = Column(String)
    specialization = Column(String)
    interactionType = Column(String)
    visitDate = Column(String, index=True)
    visitTime = Column(String)
    attendees = Column(String)
    product = Column(String, index=True)
    materials = Column(String)
    samples = Column(Integer, default=0)
    notes = Column(String)
    sentiment = Column(String, default="Neutral")
    outcomes = Column(String)
    followUp = Column(String)
    summary = Column(String)

    # Enterprise relational extensions (nullable for backwards-compatibility)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=True, index=True)
    hco_id = Column(Integer, ForeignKey("hcos.id"), nullable=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    status = Column(String(50), default="Completed")
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="interactions", foreign_keys=[user_id])
    hcp = relationship("HCP", back_populates="interactions", foreign_keys=[hcp_id])
    hco = relationship("HCO", back_populates="interactions", foreign_keys=[hco_id])
    product_rel = relationship("Product", foreign_keys=[product_id])


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), default="SALES_REP", index=True)  # ADMIN, SALES_REP, MEDICAL_DIRECTOR, COMPLIANCE_OFFICER
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=True, index=True)
    phone = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=func.now())
    last_login_at = Column(DateTime, nullable=True)

    # Indian Healthcare & Demographic Extensions
    abha_number = Column(String(50), nullable=True, index=True)
    abha_address = Column(String(100), nullable=True)
    house_flat_no = Column(String(100), nullable=True)
    street_name = Column(String(255), nullable=True)
    locality_area = Column(String(255), nullable=True)
    city_town = Column(String(100), nullable=True)
    district = Column(String(100), nullable=True)
    state_or_ut = Column(String(100), nullable=True)
    pin_code = Column(String(10), nullable=True, index=True)

    # Patient Clinical Demographics
    date_of_birth = Column(String(20), nullable=True)
    gender = Column(String(20), nullable=True)
    blood_group = Column(String(10), nullable=True)
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)

    # Doctor Qualifications & Medical Council Registration
    medical_council_reg_no = Column(String(100), nullable=True, index=True)
    medical_council_name = Column(String(150), nullable=True)
    doctor_qualifications = Column(String(255), nullable=True)
    doctor_specialty = Column(String(100), nullable=True)

    # Pharmacist Licensing & Registration
    pharmacist_reg_no = Column(String(100), nullable=True, index=True)
    state_pharmacy_council = Column(String(150), nullable=True)
    pharmacy_license_no_20 = Column(String(100), nullable=True)
    pharmacy_license_no_21 = Column(String(100), nullable=True)

    territory = relationship("Territory", back_populates="users")
    interactions = relationship("Interaction", back_populates="user")
    assigned_hcps = relationship("HCP", back_populates="assigned_rep")
    assigned_tasks = relationship("Task", back_populates="assigned_to", foreign_keys="Task.assigned_to_id")
    prescriptions = relationship("Prescription", back_populates="patient", foreign_keys="Prescription.patient_id")
    prescribed_medications = relationship("Prescription", back_populates="prescriber", foreign_keys="Prescription.prescriber_id")


class Territory(Base):
    __tablename__ = "territories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True, nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    region = Column(String(100), index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())

    users = relationship("User", back_populates="territory")
    hcos = relationship("HCO", back_populates="territory")
    hcps = relationship("HCP", back_populates="territory")


class HCO(Base):
    __tablename__ = "hcos"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=False)
    type = Column(String(100), default="Hospital", index=True)  # Hospital, Clinic, Academic Medical Center, Pharmacy, Distributor
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=True, index=True)
    address = Column(String(255), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(50), nullable=True)
    postal_code = Column(String(20), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    bed_count = Column(Integer, default=0)
    purchasing_tier = Column(String(50), default="Tier 2")
    latitude = Column(Float, nullable=True, index=True)
    longitude = Column(Float, nullable=True, index=True)
    operating_hours = Column(String(255), default="Mon-Sat: 08:00 AM - 08:00 PM")
    is_verified = Column(Boolean, default=True)
    facility_category = Column(String(100), default="Hospital", index=True)  # Chemist/Pharmacy, Jan Aushadhi Kendra, Clinic, Hospital, Diagnostic Lab
    locality_area = Column(String(255), nullable=True)
    district = Column(String(100), nullable=True)
    pin_code = Column(String(10), nullable=True, index=True)
    drug_license_no_20 = Column(String(100), nullable=True)
    drug_license_no_21 = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    territory = relationship("Territory", back_populates="hcos")
    hcps = relationship("HCP", back_populates="hco")
    interactions = relationship("Interaction", back_populates="hco")


class HCP(Base):
    __tablename__ = "hcps"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), index=True, nullable=False)
    last_name = Column(String(100), index=True, nullable=False)
    npi_number = Column(String(50), unique=True, index=True, nullable=False)
    specialty = Column(String(100), index=True, nullable=False)
    hco_id = Column(Integer, ForeignKey("hcos.id"), nullable=True, index=True)
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=True, index=True)
    assigned_rep_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    prescribing_tier = Column(String(50), default="Tier 2", index=True)  # Tier 1, Tier 2, Tier 3
    preferred_channel = Column(String(50), default="In-Person")  # In-Person, Email, Phone, Virtual
    relationship_status = Column(String(50), default="Active Detailing", index=True)  # Prospect, Active Detailing, Prescribing Advocate, Dormant
    license_state = Column(String(10), default="NY")
    license_verified = Column(Boolean, default=True)
    medical_council_reg_no = Column(String(100), nullable=True, index=True)
    medical_council_name = Column(String(150), default="State Medical Council")
    qualifications = Column(String(255), default="MBBS")
    consultation_fee_inr = Column(Float, default=500.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    hco = relationship("HCO", back_populates="hcps")
    territory = relationship("Territory", back_populates="hcps")
    assigned_rep = relationship("User", back_populates="assigned_hcps")
    interactions = relationship("Interaction", back_populates="hcp")
    tasks = relationship("Task", back_populates="hcp")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    brand_name = Column(String(255), unique=True, index=True, nullable=False)
    generic_name = Column(String(255), index=True, nullable=False)
    ndc_code = Column(String(100), unique=True, index=True, nullable=False)
    category = Column(String(100), index=True, nullable=False)
    dosage_form = Column(String(100), nullable=False)
    strength = Column(String(100), nullable=False)
    therapeutic_class = Column(String(255), nullable=True)
    manufacturer = Column(String(255), default="MedIntel Pharma")
    approved_indications = Column(Text, nullable=True)
    regulatory_status = Column(String(100), default="FDA Approved")
    storage_conditions = Column(String(255), default="Store at 20°C to 25°C (68°F to 77°F)")
    package_size = Column(String(100), default="Bottle of 100 tablets")
    schedule_category = Column(String(50), default="Schedule H", index=True)  # Schedule H, Schedule H1, Schedule X, Schedule G, OTC
    mrp_inr = Column(Float, default=100.0)
    ptr_inr = Column(Float, default=75.0)
    gst_percentage = Column(Float, default=12.0)
    barcode_gtin = Column(String(100), nullable=True, index=True)
    cdsco_approved = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True, index=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class SampleInventory(Base):
    __tablename__ = "samples_inventory"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    lot_number = Column(String(100), index=True, nullable=False)
    expiration_date = Column(String(50), nullable=False)
    allocated_rep_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    quantity_available = Column(Integer, default=0)
    quantity_distributed = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())

    product = relationship("Product")
    allocated_rep = relationship("User")


class SampleDistribution(Base):
    __tablename__ = "sample_distributions"

    id = Column(Integer, primary_key=True, index=True)
    interaction_id = Column(Integer, ForeignKey("interactions.id"), nullable=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    lot_number = Column(String(100), nullable=False)
    quantity = Column(Integer, default=1)
    rep_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    signature_received = Column(Boolean, default=True)
    distributed_at = Column(DateTime, default=func.now())

    hcp = relationship("HCP")
    product = relationship("Product")
    rep = relationship("User")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    contact_name = Column(String(255), index=True, nullable=False)
    organization_name = Column(String(255), nullable=True)
    email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    specialty = Column(String(100), index=True, nullable=True)
    territory_id = Column(Integer, ForeignKey("territories.id"), nullable=True, index=True)
    assigned_rep_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    stage = Column(String(50), default="New", index=True)  # New, Contacted, Qualified, Proposal, Converted, Disqualified
    lead_score = Column(Integer, default=50)
    source = Column(String(100), default="Inbound")
    notes = Column(Text, nullable=True)
    converted_hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    territory = relationship("Territory")
    assigned_rep = relationship("User")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    therapeutic_area = Column(String(100), index=True)
    target_specialty = Column(String(100), index=True)
    channel = Column(String(100), default="Detailing Drive")
    start_date = Column(String(50))
    end_date = Column(String(50))
    budget = Column(Float, default=0.0)
    status = Column(String(50), default="Active", index=True)  # Draft, Scheduled, Active, Completed, Paused
    approved_template = Column(Text, nullable=True)
    target_count = Column(Integer, default=0)
    engaged_count = Column(Integer, default=0)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=func.now())


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(String(50), index=True, nullable=False)
    priority = Column(String(50), default="Medium", index=True)  # High, Medium, Low
    status = Column(String(50), default="Pending", index=True)  # Pending, In_Progress, Completed, Cancelled
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=True, index=True)
    interaction_id = Column(Integer, ForeignKey("interactions.id"), nullable=True, index=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())

    assigned_to = relationship("User", back_populates="assigned_tasks", foreign_keys=[assigned_to_id])
    hcp = relationship("HCP", back_populates="tasks")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # info, warning, success, alert
    is_read = Column(Boolean, default=False, index=True)
    link = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    actor_email = Column(String(255), nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(100), nullable=False, index=True)
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=func.now(), index=True)


class CRMConfig(Base):
    __tablename__ = "crm_configs"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=False)
    category = Column(String(100), default="general", index=True)
    description = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    prescriber_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)

    medicine_name = Column(String(255), index=True, nullable=False)
    generic_name = Column(String(255), nullable=True)
    strength = Column(String(100), nullable=False)
    dosage_quantity = Column(Float, default=1.0)
    dosage_unit = Column(String(50), default="Tablet")  # Tablet, Capsule, ml, Drops, Injection
    frequency = Column(String(100), default="Once Daily")
    scheduled_times = Column(JSON, default=lambda: ["Morning"])  # List of slots, e.g. ["Morning", "Night"]
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    food_instruction = Column(String(50), default="After Food")  # Before Food, After Food, With Food, No Restriction
    instructions = Column(Text, nullable=True)
    prescription_attachment = Column(String(500), nullable=True)
    status = Column(String(50), default="Active", index=True)  # Active, Completed, Discontinued
    schedule_category = Column(String(50), default="Schedule H", index=True)
    route = Column(String(50), default="Oral")
    frequency_indian = Column(String(50), default="Once Daily (OD)")
    duration_days = Column(Integer, default=5)
    doctor_registration_no = Column(String(100), nullable=True)
    instructions_vernacular = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    patient = relationship("User", foreign_keys=[patient_id], back_populates="prescriptions")
    prescriber = relationship("User", foreign_keys=[prescriber_id], back_populates="prescribed_medications")
    product = relationship("Product")
    schedules = relationship("MedicationScheduleLog", back_populates="prescription", cascade="all, delete-orphan")


class MedicationScheduleLog(Base):
    __tablename__ = "medication_schedule_logs"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    scheduled_date = Column(Date, nullable=False, index=True)
    scheduled_slot = Column(String(50), nullable=False, index=True)  # Morning, Afternoon, Evening, Night
    scheduled_time = Column(String(20), default="08:00")
    status = Column(String(50), default="Scheduled", index=True)  # Scheduled, Taken, Skipped, Snoozed, Missed
    taken_at = Column(DateTime, nullable=True)
    skipped_reason = Column(String(255), nullable=True)
    snooze_until = Column(DateTime, nullable=True)
    is_verified = Column(Boolean, default=False)
    verification_method = Column(String(50), nullable=True)  # AI_VISION, BARCODE, MANUAL
    verification_notes = Column(Text, nullable=True)
    verification_image_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint("prescription_id", "scheduled_date", "scheduled_slot", name="uq_prescription_date_slot"),
    )

    prescription = relationship("Prescription", back_populates="schedules")
    user = relationship("User")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    hcp_id = Column(Integer, ForeignKey("hcps.id"), nullable=True, index=True)
    appointment_date = Column(Date, nullable=False, index=True)
    slot_time = Column(String(50), nullable=False)  # e.g. "10:00 AM"
    appointment_type = Column(String(50), default="In-Person")  # In-Person, Virtual / Video, Consultation
    reason = Column(String(255), nullable=False)
    status = Column(String(50), default="Requested", index=True)  # Requested, Confirmed, Completed, Cancelled, Rejected
    consultation_mode = Column(String(50), default="OPD In-Person")  # OPD In-Person, Teleconsultation / Video, Clinic Walk-in
    consultation_fee_inr = Column(Float, default=500.0)
    patient_language = Column(String(50), default="English")  # English, Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali
    transcript_original = Column(Text, nullable=True)
    clinical_summary_english = Column(Text, nullable=True)
    clinical_notes = Column(Text, nullable=True)
    diagnosis = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
    hcp = relationship("HCP", foreign_keys=[hcp_id])


class PharmacyOrder(Base):
    __tablename__ = "pharmacy_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(100), unique=True, index=True, nullable=False)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id"), nullable=False, index=True)
    pharmacy_hco_id = Column(Integer, ForeignKey("hcos.id"), nullable=True, index=True)
    status = Column(String(50), default="Pending Verification", index=True)  # Pending Verification, Verified, Preparing, Ready for Pickup, Dispensed, Cancelled
    delivery_type = Column(String(50), default="Store Pickup")  # Store Pickup, Home Delivery
    delivery_address = Column(String(255), nullable=True)
    patient_notes = Column(Text, nullable=True)
    pharmacist_notes = Column(Text, nullable=True)
    schedule_category = Column(String(50), default="Schedule H", index=True)
    total_amount_inr = Column(Float, default=0.0)
    dispensed_pharmacist_reg_no = Column(String(100), nullable=True)
    h1_register_logged = Column(Boolean, default=False)
    dispensed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    patient = relationship("User", foreign_keys=[patient_id])
    prescription = relationship("Prescription", foreign_keys=[prescription_id])
    pharmacy = relationship("HCO", foreign_keys=[pharmacy_hco_id])


class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    report_type = Column(String(100), default="Lab Test", index=True)  # Lab Test, Radiology, Prescription, Discharge Summary, Other
    test_category = Column(String(100), default="General Diagnostic", index=True)
    biomarkers = Column(JSON, nullable=True)
    report_date = Column(Date, nullable=False)
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size_kb = Column(Float, default=0.0)
    clinical_observations = Column(Text, nullable=True)
    status = Column(String(50), default="Uploaded", index=True)  # Uploaded, Under Review, Reviewed
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    patient = relationship("User", foreign_keys=[patient_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])


class PharmacyInventory(Base):
    __tablename__ = "pharmacy_inventory"

    id = Column(Integer, primary_key=True, index=True)
    hco_id = Column(Integer, ForeignKey("hcos.id"), nullable=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    medicine_name = Column(String(255), nullable=False, index=True)
    generic_name = Column(String(255), nullable=True)
    strength = Column(String(100), nullable=False)
    dosage_form = Column(String(100), default="Tablet")
    stock_quantity = Column(Integer, default=100)
    reorder_level = Column(Integer, default=20)
    unit_price = Column(Float, default=15.0)
    mrp_inr = Column(Float, default=50.0)
    schedule_category = Column(String(50), default="Schedule H", index=True)
    mfg_date = Column(String(50), nullable=True)
    lot_number = Column(String(100), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    status = Column(String(50), default="In Stock", index=True)  # In Stock, Low Stock, Out of Stock
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    pharmacy = relationship("HCO", foreign_keys=[hco_id])
    product = relationship("Product", foreign_keys=[product_id])


class ScheduleH1Register(Base):
    __tablename__ = "schedule_h1_registers"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("pharmacy_orders.id"), nullable=True, index=True)
    patient_name = Column(String(255), nullable=False)
    patient_address = Column(String(255), nullable=False)
    prescriber_name = Column(String(255), nullable=False)
    prescriber_registration_no = Column(String(100), nullable=False)
    prescriber_address = Column(String(255), nullable=True)
    drug_name = Column(String(255), nullable=False)
    batch_number = Column(String(100), nullable=False)
    quantity_dispensed = Column(Integer, default=1)
    dispensed_at = Column(DateTime, default=func.now(), index=True)
    pharmacist_name = Column(String(255), nullable=False)
    pharmacist_reg_no = Column(String(100), nullable=False)


class UserConsent(Base):
    __tablename__ = "user_consents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    consent_type = Column(String(100), default="DPDPA_HEALTH_DATA_PROCESSING")
    consent_language = Column(String(50), default="en")
    consent_text = Column(Text, nullable=False)
    is_granted = Column(Boolean, default=True)
    granted_at = Column(DateTime, default=func.now())
    ip_address = Column(String(50), nullable=True)



