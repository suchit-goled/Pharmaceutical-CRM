from typing import Optional, List, Any, Generic, TypeVar
from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict

# ---------------------------------------------------------
# Generic Pagination Wrapper
# ---------------------------------------------------------
T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    pages: int

# ---------------------------------------------------------
# Authentication & User Schemas
# ---------------------------------------------------------
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class LoginRequest(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    full_name: str
    role: str = "SALES_REP"  # ADMIN, SALES_REP, MEDICAL_DIRECTOR, COMPLIANCE_OFFICER
    territory_id: Optional[int] = None
    phone: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    territory_id: Optional[int] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    territory_id: Optional[int] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    last_login_at: Optional[datetime] = None

    # Indian Healthcare & Profile Extensions
    abha_number: Optional[str] = None
    abha_address: Optional[str] = None
    house_flat_no: Optional[str] = None
    street_name: Optional[str] = None
    locality_area: Optional[str] = None
    city_town: Optional[str] = None
    district: Optional[str] = None
    state_or_ut: Optional[str] = None
    pin_code: Optional[str] = None
    date_of_birth: Optional[str] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    medical_council_reg_no: Optional[str] = None
    medical_council_name: Optional[str] = None
    doctor_qualifications: Optional[str] = None
    doctor_specialty: Optional[str] = None
    pharmacist_reg_no: Optional[str] = None
    state_pharmacy_council: Optional[str] = None
    pharmacy_license_no_20: Optional[str] = None
    pharmacy_license_no_21: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# ---------------------------------------------------------
# Territory Schemas
# ---------------------------------------------------------
class TerritoryBase(BaseModel):
    name: str
    code: str
    region: str
    description: Optional[str] = None

class TerritoryCreate(TerritoryBase):
    pass

class TerritoryOut(TerritoryBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ---------------------------------------------------------
# HCO (Healthcare Organization) Schemas
# ---------------------------------------------------------
class HCOBase(BaseModel):
    name: str
    type: str = "Hospital"
    territory_id: Optional[int] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    bed_count: int = 0
    purchasing_tier: str = "Tier 2"

class HCOCreate(HCOBase):
    pass

class HCOUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    territory_id: Optional[int] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    bed_count: Optional[int] = None
    purchasing_tier: Optional[str] = None

class HCOOut(HCOBase):
    id: int
    facility_category: Optional[str] = "Hospital"
    locality_area: Optional[str] = None
    district: Optional[str] = None
    pin_code: Optional[str] = None
    drug_license_no_20: Optional[str] = None
    drug_license_no_21: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    operating_hours: Optional[str] = None
    is_verified: bool = True
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ---------------------------------------------------------
# HCP (Healthcare Professional) Schemas
# ---------------------------------------------------------
class HCPBase(BaseModel):
    first_name: str
    last_name: str
    npi_number: str
    specialty: str
    hco_id: Optional[int] = None
    territory_id: Optional[int] = None
    assigned_rep_id: Optional[int] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    prescribing_tier: str = "Tier 2"
    preferred_channel: str = "In-Person"
    relationship_status: str = "Active Detailing"
    license_state: str = "NY"
    license_verified: bool = True
    notes: Optional[str] = None

class HCPCreate(HCPBase):
    pass

class HCPUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    npi_number: Optional[str] = None
    specialty: Optional[str] = None
    hco_id: Optional[int] = None
    territory_id: Optional[int] = None
    assigned_rep_id: Optional[int] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    prescribing_tier: Optional[str] = None
    preferred_channel: Optional[str] = None
    relationship_status: Optional[str] = None
    license_state: Optional[str] = None
    license_verified: Optional[bool] = None
    notes: Optional[str] = None

class HCPOut(HCPBase):
    id: int
    medical_council_reg_no: Optional[str] = None
    medical_council_name: Optional[str] = "State Medical Council"
    qualifications: Optional[str] = "MBBS"
    consultation_fee_inr: Optional[float] = 500.0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ---------------------------------------------------------
# Product (Pharmaceutical Catalogue) Schemas
# ---------------------------------------------------------
class ProductBase(BaseModel):
    brand_name: str
    generic_name: str
    ndc_code: str
    category: str
    dosage_form: str
    strength: str
    therapeutic_class: Optional[str] = None
    manufacturer: str = "MedIntel Pharma"
    approved_indications: Optional[str] = None
    regulatory_status: str = "CDSCO Approved"
    storage_conditions: str = "Store below 30°C in a dry place."
    package_size: str = "Strip of 10 tablets"
    schedule_category: str = "Schedule H"
    mrp_inr: float = 100.0
    ptr_inr: float = 75.0
    gst_percentage: float = 12.0
    barcode_gtin: Optional[str] = None
    cdsco_approved: bool = True
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    brand_name: Optional[str] = None
    generic_name: Optional[str] = None
    ndc_code: Optional[str] = None
    category: Optional[str] = None
    dosage_form: Optional[str] = None
    strength: Optional[str] = None
    therapeutic_class: Optional[str] = None
    manufacturer: Optional[str] = None
    approved_indications: Optional[str] = None
    regulatory_status: Optional[str] = None
    storage_conditions: Optional[str] = None
    package_size: Optional[str] = None
    is_active: Optional[bool] = None

class ProductOut(ProductBase):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ---------------------------------------------------------
# Interaction Schemas (Backward-Compatible + Extended)
# ---------------------------------------------------------
class InteractionBase(BaseModel):
    doctor: str = ""
    hospital: str = ""
    specialization: str = ""
    interactionType: str = "In-Person Detailing"
    visitDate: str = ""
    visitTime: str = ""
    attendees: str = ""
    product: str = ""
    materials: str = ""
    samples: int = 0
    notes: str = ""
    sentiment: str = "Neutral"
    outcomes: str = ""
    followUp: str = ""
    summary: str = ""

    # Optional relational extensions
    user_id: Optional[int] = None
    hcp_id: Optional[int] = None
    hco_id: Optional[int] = None
    product_id: Optional[int] = None
    status: Optional[str] = "Completed"

class InteractionCreate(InteractionBase):
    pass

class InteractionResponse(InteractionBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ---------------------------------------------------------
# Leads Schemas
# ---------------------------------------------------------
class LeadBase(BaseModel):
    contact_name: str
    organization_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    territory_id: Optional[int] = None
    assigned_rep_id: Optional[int] = None
    stage: str = "New"
    lead_score: int = 50
    source: str = "Inbound"
    notes: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    contact_name: Optional[str] = None
    organization_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    specialty: Optional[str] = None
    territory_id: Optional[int] = None
    assigned_rep_id: Optional[int] = None
    stage: Optional[str] = None
    lead_score: Optional[int] = None
    source: Optional[str] = None
    notes: Optional[str] = None

class LeadOut(LeadBase):
    id: int
    converted_hcp_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ---------------------------------------------------------
# Campaign Schemas
# ---------------------------------------------------------
class CampaignBase(BaseModel):
    name: str
    therapeutic_area: Optional[str] = None
    target_specialty: Optional[str] = None
    channel: str = "Detailing Drive"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: float = 0.0
    status: str = "Active"
    approved_template: Optional[str] = None
    target_count: int = 0
    engaged_count: int = 0

class CampaignCreate(CampaignBase):
    pass

class CampaignOut(CampaignBase):
    id: int
    created_by_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ---------------------------------------------------------
# Task Schemas
# ---------------------------------------------------------
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: str
    priority: str = "Medium"  # High, Medium, Low
    status: str = "Pending"  # Pending, In_Progress, Completed, Cancelled
    assigned_to_id: int
    hcp_id: Optional[int] = None
    interaction_id: Optional[int] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to_id: Optional[int] = None
    completed_at: Optional[datetime] = None

class TaskOut(TaskBase):
    id: int
    created_by_id: Optional[int] = None
    completed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ---------------------------------------------------------
# Audit Log & Config Schemas
# ---------------------------------------------------------
class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    actor_email: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    model_config = ConfigDict(from_attributes=True)

class CRMConfigBase(BaseModel):
    key: str
    value: str
    category: str = "general"
    description: Optional[str] = None

class CRMConfigCreate(CRMConfigBase):
    pass

class CRMConfigOut(CRMConfigBase):
    id: int
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ---------------------------------------------------------
# Dashboard Metrics Schema
# ---------------------------------------------------------
class AdminDashboardStats(BaseModel):
    total_users: int
    active_reps: int
    total_hcps: int
    total_hcos: int
    total_products: int
    total_interactions: int
    interactions_this_month: int
    open_tasks: int
    high_priority_tasks: int
    active_campaigns: int
    compliance_rate: float
    sentiment_breakdown: dict
    interaction_types_breakdown: dict
    top_specialties: List[dict]
    recent_activities: List[dict]

# ---------------------------------------------------------
# Healthcare Map Schemas
# ---------------------------------------------------------
class HealthcareLocationOut(BaseModel):
    id: Optional[int] = None
    name: str
    type: str  # Hospital, Clinic, Pharmacy
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    operating_hours: Optional[str] = None
    distance_km: Optional[float] = None
    directions_url: Optional[str] = None
    is_verified: bool = True

    model_config = ConfigDict(from_attributes=True)

# ---------------------------------------------------------
# Smart Medication & Prescription Schemas
# ---------------------------------------------------------
class PrescriptionBase(BaseModel):
    patient_id: int
    medicine_name: str
    generic_name: Optional[str] = None
    strength: str
    dosage_quantity: float = 1.0
    dosage_unit: str = "Tablet"
    frequency: str = "Once Daily"
    scheduled_times: List[str] = ["Morning"]
    start_date: date
    end_date: Optional[date] = None
    food_instruction: str = "After Food"
    instructions: Optional[str] = None
    product_id: Optional[int] = None
    prescription_attachment: Optional[str] = None
    schedule_category: str = "Schedule H"
    route: str = "Oral"
    frequency_indian: str = "Once Daily (OD)"
    duration_days: int = 5
    doctor_registration_no: Optional[str] = None
    instructions_vernacular: Optional[str] = None

class PrescriptionCreate(PrescriptionBase):
    pass

class PrescriptionUpdate(BaseModel):
    strength: Optional[str] = None
    dosage_quantity: Optional[float] = None
    dosage_unit: Optional[str] = None
    frequency: Optional[str] = None
    scheduled_times: Optional[List[str]] = None
    end_date: Optional[date] = None
    food_instruction: Optional[str] = None
    instructions: Optional[str] = None
    status: Optional[str] = None
    schedule_category: Optional[str] = None
    frequency_indian: Optional[str] = None
    duration_days: Optional[int] = None
    instructions_vernacular: Optional[str] = None

class PrescriptionOut(PrescriptionBase):
    id: int
    prescriber_id: int
    prescriber_name: Optional[str] = None
    patient_name: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class MedicationScheduleLogOut(BaseModel):
    id: int
    prescription_id: int
    medicine_name: str
    generic_name: Optional[str] = None
    strength: str
    dosage_quantity: float
    dosage_unit: str
    food_instruction: str
    instructions: Optional[str] = None
    scheduled_date: date
    scheduled_slot: str
    scheduled_time: str
    status: str
    taken_at: Optional[datetime] = None
    skipped_reason: Optional[str] = None
    snooze_until: Optional[datetime] = None
    is_verified: bool
    verification_method: Optional[str] = None
    verification_notes: Optional[str] = None
    verification_image_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class MedicationDoseTakeRequest(BaseModel):
    is_verified: bool = False
    verification_method: Optional[str] = "MANUAL"
    verification_notes: Optional[str] = None
    verification_image_url: Optional[str] = None

class MedicationDoseSkipRequest(BaseModel):
    reason: str

class MedicationDoseSnoozeRequest(BaseModel):
    snooze_minutes: int = 15

class MedicationVerificationRequest(BaseModel):
    image_base64: Optional[str] = None
    packaging_text: Optional[str] = None
    barcode: Optional[str] = None

class MedicationVerificationResponse(BaseModel):
    status: str  # VERIFIED, WARNING, MISMATCH
    verified: bool
    confidence_score: float
    detected_medicine_name: Optional[str] = None
    detected_strength: Optional[str] = None
    detected_expiry: Optional[str] = None
    is_expired: bool = False
    details: str
    warnings: List[str] = []
    food_advisory: Optional[str] = None

class MedicationAdherenceReport(BaseModel):
    daily_adherence_rate: float
    weekly_adherence_rate: float
    total_doses: int
    taken_doses: int
    skipped_doses: int
    missed_doses: int
    verified_percentage: float


# ---------------------------------------------------------
# Appointments Schemas
# ---------------------------------------------------------
class AppointmentCreate(BaseModel):
    doctor_id: Optional[int] = None
    hcp_id: Optional[int] = None
    appointment_date: date
    slot_time: str
    appointment_type: str = "In-Person"
    consultation_mode: str = "OPD In-Person"  # OPD In-Person, Teleconsultation / Video, Clinic Walk-in
    consultation_fee_inr: float = 500.0
    patient_language: str = "English"  # English, Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali
    reason: str

class AppointmentStatusUpdate(BaseModel):
    status: str  # Confirmed, Rejected, Completed, Cancelled

class AppointmentConsultationUpdate(BaseModel):
    clinical_notes: str
    diagnosis: Optional[str] = None
    status: str = "Completed"
    transcript_original: Optional[str] = None
    clinical_summary_english: Optional[str] = None

class AppointmentOut(BaseModel):
    id: int
    patient_id: int
    patient_name: Optional[str] = None
    doctor_id: Optional[int] = None
    doctor_name: Optional[str] = None
    hcp_id: Optional[int] = None
    hcp_name: Optional[str] = None
    appointment_date: date
    slot_time: str
    appointment_type: str
    consultation_mode: Optional[str] = "OPD In-Person"
    consultation_fee_inr: Optional[float] = 500.0
    patient_language: Optional[str] = "English"
    reason: str
    status: str
    transcript_original: Optional[str] = None
    clinical_summary_english: Optional[str] = None
    clinical_notes: Optional[str] = None
    diagnosis: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Pharmacy Orders Schemas
# ---------------------------------------------------------
class PharmacyOrderCreate(BaseModel):
    prescription_id: int
    pharmacy_hco_id: Optional[int] = None
    delivery_type: str = "Store Pickup"
    delivery_address: Optional[str] = None
    patient_notes: Optional[str] = None

class PharmacyOrderStatusUpdate(BaseModel):
    status: str  # Verified, Preparing, Ready for Pickup, Dispensed, Cancelled
    pharmacist_notes: Optional[str] = None
    dispensed_pharmacist_reg_no: Optional[str] = None

class PharmacyOrderOut(BaseModel):
    id: int
    order_number: str
    patient_id: int
    patient_name: Optional[str] = None
    prescription_id: int
    medicine_name: Optional[str] = None
    dosage_strength: Optional[str] = None
    pharmacy_hco_id: Optional[int] = None
    pharmacy_name: Optional[str] = None
    schedule_category: Optional[str] = "Schedule H"
    total_amount_inr: Optional[float] = 0.0
    dispensed_pharmacist_reg_no: Optional[str] = None
    h1_register_logged: Optional[bool] = False
    status: str
    delivery_type: str
    delivery_address: Optional[str] = None
    patient_notes: Optional[str] = None
    pharmacist_notes: Optional[str] = None
    dispensed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Medical Reports Schemas
# ---------------------------------------------------------
class MedicalReportCreate(BaseModel):
    title: str
    report_type: str = "Lab Test"
    test_category: Optional[str] = "General Diagnostic"
    report_date: date
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size_kb: float = 0.0
    biomarkers: Optional[dict] = None
    clinical_observations: Optional[str] = None

class MedicalReportReviewUpdate(BaseModel):
    clinical_observations: str
    status: str = "Reviewed"

class MedicalReportOut(BaseModel):
    id: int
    patient_id: int
    patient_name: Optional[str] = None
    title: str
    report_type: str
    test_category: Optional[str] = "General Diagnostic"
    report_date: date
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size_kb: float
    biomarkers: Optional[dict] = None
    clinical_observations: Optional[str] = None
    status: str
    reviewed_by_id: Optional[int] = None
    reviewed_by_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Pharmacy Inventory Schemas
# ---------------------------------------------------------
class PharmacyInventoryCreate(BaseModel):
    hco_id: Optional[int] = None
    product_id: Optional[int] = None
    medicine_name: str
    generic_name: Optional[str] = None
    strength: str
    dosage_form: str = "Tablet"
    schedule_category: str = "Schedule H"
    stock_quantity: int = 100
    reorder_level: int = 20
    unit_price: float = 15.0
    mrp_inr: float = 50.0
    mfg_date: Optional[str] = None
    lot_number: Optional[str] = None
    expiry_date: Optional[str] = None

class PharmacyInventoryUpdate(BaseModel):
    stock_quantity: Optional[int] = None
    unit_price: Optional[float] = None
    mrp_inr: Optional[float] = None
    status: Optional[str] = None
    reorder_level: Optional[int] = None

class PharmacyInventoryOut(BaseModel):
    id: int
    hco_id: Optional[int] = None
    pharmacy_name: Optional[str] = None
    medicine_name: str
    generic_name: Optional[str] = None
    strength: str
    dosage_form: str
    schedule_category: Optional[str] = "Schedule H"
    stock_quantity: int
    reorder_level: int
    unit_price: float
    mrp_inr: Optional[float] = 50.0
    mfg_date: Optional[str] = None
    lot_number: Optional[str] = None
    expiry_date: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Indian Schedule H1 Register Schema
# ---------------------------------------------------------
class ScheduleH1RegisterOut(BaseModel):
    id: int
    order_id: Optional[int] = None
    patient_name: str
    patient_address: str
    prescriber_name: str
    prescriber_registration_no: str
    prescriber_address: Optional[str] = None
    drug_name: str
    batch_number: str
    quantity_dispensed: int
    dispensed_at: Optional[datetime] = None
    pharmacist_name: str
    pharmacist_reg_no: str

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------
# Indian Doctor-Patient Multilingual AI Schemas
# ---------------------------------------------------------
class DoctorPatientConsultationAIRequest(BaseModel):
    patient_message: str
    language: str = "Hindi"  # English, Hindi, Kannada, Tamil, Telugu, Malayalam, Marathi, Bengali
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    current_symptoms: Optional[str] = None
    history: Optional[List[dict]] = []

class DoctorPatientConsultationAIResponse(BaseModel):
    language: str
    doctor_reply_vernacular: str
    doctor_reply_english: str
    clinical_summary_english: str
    extracted_symptoms: List[str]
    suggested_investigations: List[str]
    prescribing_cautions: List[str]


# ---------------------------------------------------------
# Support, Contact & Feedback Schemas
# ---------------------------------------------------------
class ContactRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: str = Field(..., min_length=5)
    phone: Optional[str] = None
    subject: str = Field(..., min_length=3)
    message: str = Field(..., min_length=5)
    category: str = "General Support"  # Clinical Support, Pharmacy Query, Appointment Reschedule, Billing, General Support

class ContactResponse(BaseModel):
    ticket_id: str
    status: str = "Received"
    message: str
    estimated_response_hours: int
    whatsapp_helpline: str = "+91 98450 12345"
    created_at: datetime


# ---------------------------------------------------------
# Payment & Checkout Schemas (UPI, RuPay, NetBanking, COD)
# ---------------------------------------------------------
class PaymentOrderRequest(BaseModel):
    order_type: str = "CONSULTATION"  # CONSULTATION, PHARMACY_ORDER
    reference_id: int
    amount_inr: float
    patient_name: str
    patient_phone: Optional[str] = None
    patient_email: Optional[str] = None
    payment_method: str = "UPI"  # UPI, CARD, NETBANKING, COD

class PaymentOrderResponse(BaseModel):
    payment_id: str
    invoice_number: str
    order_type: str
    reference_id: int
    base_amount_inr: float
    cgst_inr: float
    sgst_inr: float
    total_amount_inr: float
    currency: str = "INR"
    status: str = "PENDING"
    qr_code_upi_string: str
    payment_methods_available: List[str]
    created_at: datetime

class PaymentVerifyRequest(BaseModel):
    payment_id: str
    reference_id: int
    order_type: str
    payment_method: str
    transaction_reference: Optional[str] = None
    amount_inr: float

class PaymentVerifyResponse(BaseModel):
    success: bool
    status: str = "CONFIRMED"
    invoice_number: str
    transaction_id: str
    receipt_message: str
    verified_at: datetime


# ---------------------------------------------------------
# Email Verification Schemas
# ---------------------------------------------------------
class EmailVerificationRequest(BaseModel):
    email: str

class EmailVerificationResponse(BaseModel):
    email: str
    status: str = "SENT"
    message: str




