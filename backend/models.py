from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Index
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

    territory = relationship("Territory", back_populates="users")
    interactions = relationship("Interaction", back_populates="user")
    assigned_hcps = relationship("HCP", back_populates="assigned_rep")
    assigned_tasks = relationship("Task", back_populates="assigned_to", foreign_keys="Task.assigned_to_id")


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
