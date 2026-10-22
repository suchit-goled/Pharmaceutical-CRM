from typing import Optional, List, Any, Generic, TypeVar
from datetime import datetime
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
    regulatory_status: str = "FDA Approved"
    storage_conditions: str = "Store at 20°C to 25°C"
    package_size: str = "Bottle of 100 tablets"
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
