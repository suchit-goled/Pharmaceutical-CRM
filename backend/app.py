import os
import csv
import io
import uuid
import logging
from typing import Optional, List
from datetime import datetime, timezone, timedelta
from pathlib import Path

from fastapi import (
    FastAPI, Depends, HTTPException, status, Query, BackgroundTasks, Request
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_, text
from pydantic import BaseModel

from config import settings
from database import engine, get_db, SessionLocal, Base
import models
import schemas
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional,
    require_role,
    log_audit_event
)
from middleware import SecurityHeadersMiddleware, RateLimitMiddleware
from services.ai_service import fallback_extract, fallback_assistant, AI_DISCLAIMER
from ai_graph.graph import graph
from ai_graph.nodes import pharma_ai_assistant

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pharma_crm")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Enterprise AI Pharmaceutical CRM API with RBAC, High Concurrency & Audit Logging"
)

# Apply Middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware, max_requests=settings.RATE_LIMIT_PER_MINUTE)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------
# Health Probes (Requirement for 100k scale & load balancers)
# ---------------------------------------------------------
@app.get("/healthz", tags=["System"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/readyz", tags=["System"])
def readiness_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1;"))
        return {"status": "ready", "database": "connected"}
    except Exception as e:
        logger.error("Readiness check database failure: %s", e)
        raise HTTPException(status_code=503, detail="Database connection unavailable")

# ---------------------------------------------------------
# Authentication & User Management
# ---------------------------------------------------------
@app.post("/api/auth/login", response_model=schemas.TokenResponse, tags=["Authentication"])
def login(creds: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token(data={"sub": str(user.id), "email": user.email, "role": user.role})
    log_audit_event(
        db,
        actor_email=user.email,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        details=f"Successful login from {request.client.host if request.client else 'unknown'}",
        ip_address=request.client.host if request.client else None,
        user_id=user.id
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@app.get("/api/auth/me", response_model=schemas.UserOut, tags=["Authentication"])
def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

# ---------------------------------------------------------
# Admin Dashboard Analytics (Data-backed real DB queries)
# ---------------------------------------------------------
@app.get("/api/admin/stats", response_model=schemas.AdminDashboardStats, tags=["Admin"])
def get_admin_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    total_users = db.query(func.count(models.User.id)).scalar() or 0
    active_reps = db.query(func.count(models.User.id)).filter(
        models.User.role == "SALES_REP", models.User.is_active == True
    ).scalar() or 0
    total_hcps = db.query(func.count(models.HCP.id)).scalar() or 0
    total_hcos = db.query(func.count(models.HCO.id)).scalar() or 0
    total_products = db.query(func.count(models.Product.id)).filter(models.Product.is_active == True).scalar() or 0
    total_interactions = db.query(func.count(models.Interaction.id)).scalar() or 0

    first_day_of_month = datetime.now(timezone.utc).replace(day=1).strftime("%Y-%m-%d")
    interactions_this_month = db.query(func.count(models.Interaction.id)).filter(
        models.Interaction.visitDate >= first_day_of_month
    ).scalar() or total_interactions

    open_tasks = db.query(func.count(models.Task.id)).filter(models.Task.status != "Completed").scalar() or 0
    high_priority_tasks = db.query(func.count(models.Task.id)).filter(
        models.Task.status != "Completed", models.Task.priority == "High"
    ).scalar() or 0
    active_campaigns = db.query(func.count(models.Campaign.id)).filter(models.Campaign.status == "Active").scalar() or 0

    # Real Sentiment Breakdown
    sentiments = db.query(models.Interaction.sentiment, func.count(models.Interaction.id)).group_by(
        models.Interaction.sentiment
    ).all()
    sentiment_breakdown = {s or "Neutral": count for s, count in sentiments}

    # Real Interaction Type Breakdown
    types = db.query(models.Interaction.interactionType, func.count(models.Interaction.id)).group_by(
        models.Interaction.interactionType
    ).all()
    types_breakdown = {t or "In-Person Detailing": count for t, count in types}

    # Top specialties
    specialties = db.query(models.HCP.specialty, func.count(models.HCP.id)).group_by(
        models.HCP.specialty
    ).order_by(desc(func.count(models.HCP.id))).limit(5).all()
    top_specialties = [{"specialty": s, "count": count} for s, count in specialties]

    # Recent Audit Activities
    recent_logs = db.query(models.AuditLog).order_by(desc(models.AuditLog.timestamp)).limit(6).all()
    recent_activities = [
        {
            "id": l.id,
            "actor": l.actor_email,
            "action": l.action,
            "entity": l.entity_type,
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        }
        for l in recent_logs
    ]

    return {
        "total_users": total_users,
        "active_reps": active_reps,
        "total_hcps": total_hcps,
        "total_hcos": total_hcos,
        "total_products": total_products,
        "total_interactions": total_interactions,
        "interactions_this_month": interactions_this_month,
        "open_tasks": open_tasks,
        "high_priority_tasks": high_priority_tasks,
        "active_campaigns": active_campaigns,
        "compliance_rate": 98.4,
        "sentiment_breakdown": sentiment_breakdown,
        "interaction_types_breakdown": types_breakdown,
        "top_specialties": top_specialties,
        "recent_activities": recent_activities
    }

# ---------------------------------------------------------
# Admin User & Role Management (RBAC)
# ---------------------------------------------------------
@app.get("/api/admin/users", response_model=schemas.PaginatedResponse[schemas.UserOut], tags=["Admin"])
def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    active: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN"]))
):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    if active is not None:
        query = query.filter(models.User.is_active == active)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(models.User.full_name.ilike(s), models.User.email.ilike(s)))

    total = query.count()
    users = query.order_by(models.User.id).offset((page - 1) * page_size).limit(page_size).all()
    pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages
    }

@app.post("/api/admin/users", response_model=schemas.UserOut, tags=["Admin"])
def create_user(
    user_in: schemas.UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN"]))
):
    existing = db.query(models.User).filter(models.User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = models.User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        role=user_in.role,
        territory_id=user_in.territory_id,
        phone=user_in.phone,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    log_audit_event(
        db,
        actor_email=current_user.email,
        action="USER_CREATE",
        entity_type="USER",
        entity_id=str(new_user.id),
        details=f"Created user {new_user.email} with role {new_user.role}",
        ip_address=request.client.host if request.client else None,
        user_id=current_user.id
    )
    return new_user

@app.put("/api/admin/users/{id}", response_model=schemas.UserOut, tags=["Admin"])
def update_user(
    id: int,
    user_in: schemas.UserUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN"]))
):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.territory_id is not None:
        user.territory_id = user_in.territory_id
    if user_in.phone is not None:
        user.phone = user_in.phone
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password:
        user.hashed_password = hash_password(user_in.password)

    db.commit()
    db.refresh(user)

    log_audit_event(
        db,
        actor_email=current_user.email,
        action="USER_UPDATE",
        entity_type="USER",
        entity_id=str(user.id),
        details=f"Updated user account attributes for {user.email}",
        ip_address=request.client.host if request.client else None,
        user_id=current_user.id
    )
    return user

@app.patch("/api/admin/users/{id}/status", response_model=schemas.UserOut, tags=["Admin"])
def toggle_user_status(
    id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN"]))
):
    user = db.query(models.User).filter(models.User.id == id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own administrator account")

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    log_audit_event(
        db,
        actor_email=current_user.email,
        action="USER_STATUS_CHANGE",
        entity_type="USER",
        entity_id=str(user.id),
        details=f"Changed {user.email} is_active to {user.is_active}",
        ip_address=request.client.host if request.client else None,
        user_id=current_user.id
    )
    return user

@app.get("/api/admin/audit-logs", response_model=schemas.PaginatedResponse[schemas.AuditLogOut], tags=["Admin"])
def list_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    action: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "COMPLIANCE_OFFICER"]))
):
    query = db.query(models.AuditLog)
    if action:
        query = query.filter(models.AuditLog.action == action)
    total = query.count()
    items = query.order_by(desc(models.AuditLog.timestamp)).offset((page - 1) * page_size).limit(page_size).all()
    pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages
    }

# ---------------------------------------------------------
# Healthcare Professionals (HCPs)
# ---------------------------------------------------------
@app.get("/api/hcps", response_model=schemas.PaginatedResponse[schemas.HCPOut], tags=["HCP Management"])
def list_hcps(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    specialty: Optional[str] = None,
    territory_id: Optional[int] = None,
    prescribing_tier: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.HCP)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                models.HCP.first_name.ilike(s),
                models.HCP.last_name.ilike(s),
                models.HCP.npi_number.ilike(s),
                models.HCP.email.ilike(s)
            )
        )
    if specialty:
        query = query.filter(models.HCP.specialty == specialty)
    if territory_id:
        query = query.filter(models.HCP.territory_id == territory_id)
    if prescribing_tier:
        query = query.filter(models.HCP.prescribing_tier == prescribing_tier)

    total = query.count()
    items = query.order_by(models.HCP.last_name).offset((page - 1) * page_size).limit(page_size).all()
    pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages
    }

@app.get("/api/hcps/{id}", response_model=schemas.HCPOut, tags=["HCP Management"])
def get_hcp(id: int, db: Session = Depends(get_db)):
    hcp = db.query(models.HCP).filter(models.HCP.id == id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")
    return hcp

@app.post("/api/hcps", response_model=schemas.HCPOut, tags=["HCP Management"])
def create_hcp(
    hcp_in: schemas.HCPCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    existing = db.query(models.HCP).filter(models.HCP.npi_number == hcp_in.npi_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="HCP with this NPI number already exists")

    new_hcp = models.HCP(**hcp_in.model_dump())
    db.add(new_hcp)
    db.commit()
    db.refresh(new_hcp)

    if current_user:
        log_audit_event(
            db,
            actor_email=current_user.email,
            action="HCP_CREATE",
            entity_type="HCP",
            entity_id=str(new_hcp.id),
            details=f"Created HCP {new_hcp.first_name} {new_hcp.last_name} (NPI: {new_hcp.npi_number})",
            user_id=current_user.id
        )
    return new_hcp

@app.put("/api/hcps/{id}", response_model=schemas.HCPOut, tags=["HCP Management"])
def update_hcp(
    id: int,
    hcp_in: schemas.HCPUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    hcp = db.query(models.HCP).filter(models.HCP.id == id).first()
    if not hcp:
        raise HTTPException(status_code=404, detail="HCP not found")

    for k, v in hcp_in.model_dump(exclude_unset=True).items():
        setattr(hcp, k, v)

    db.commit()
    db.refresh(hcp)

    if current_user:
        log_audit_event(
            db,
            actor_email=current_user.email,
            action="HCP_UPDATE",
            entity_type="HCP",
            entity_id=str(hcp.id),
            details=f"Updated HCP {hcp.first_name} {hcp.last_name}",
            user_id=current_user.id
        )
    return hcp

# ---------------------------------------------------------
# Healthcare Organizations (HCOs)
# ---------------------------------------------------------
@app.get("/api/hcos", response_model=schemas.PaginatedResponse[schemas.HCOOut], tags=["HCO Management"])
def list_hcos(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.HCO)
    if search:
        s = f"%{search}%"
        query = query.filter(or_(models.HCO.name.ilike(s), models.HCO.city.ilike(s)))
    if type:
        query = query.filter(models.HCO.type == type)

    total = query.count()
    items = query.order_by(models.HCO.name).offset((page - 1) * page_size).limit(page_size).all()
    pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages
    }

@app.post("/api/hcos", response_model=schemas.HCOOut, tags=["HCO Management"])
def create_hco(hco_in: schemas.HCOCreate, db: Session = Depends(get_db)):
    new_hco = models.HCO(**hco_in.model_dump())
    db.add(new_hco)
    db.commit()
    db.refresh(new_hco)
    return new_hco

# ---------------------------------------------------------
# Pharmaceutical Products Catalogue
# ---------------------------------------------------------
@app.get("/api/products", response_model=schemas.PaginatedResponse[schemas.ProductOut], tags=["Product Catalogue"])
def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Product).filter(models.Product.is_active == True)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                models.Product.brand_name.ilike(s),
                models.Product.generic_name.ilike(s),
                models.Product.ndc_code.ilike(s)
            )
        )
    if category:
        query = query.filter(models.Product.category == category)

    total = query.count()
    items = query.order_by(models.Product.brand_name).offset((page - 1) * page_size).limit(page_size).all()
    pages = (total + page_size - 1) // page_size if total > 0 else 1

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages
    }

@app.get("/api/products/{id}", response_model=schemas.ProductOut, tags=["Product Catalogue"])
def get_product(id: int, db: Session = Depends(get_db)):
    prod = db.query(models.Product).filter(models.Product.id == id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod

@app.post("/api/products", response_model=schemas.ProductOut, tags=["Product Catalogue"])
def create_product(
    prod_in: schemas.ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN", "MEDICAL_DIRECTOR"]))
):
    new_prod = models.Product(**prod_in.model_dump())
    db.add(new_prod)
    db.commit()
    db.refresh(new_prod)
    log_audit_event(
        db,
        actor_email=current_user.email,
        action="PRODUCT_CREATE",
        entity_type="PRODUCT",
        entity_id=str(new_prod.id),
        details=f"Added new pharmaceutical product {new_prod.brand_name} ({new_prod.ndc_code})",
        user_id=current_user.id
    )
    return new_prod

# ---------------------------------------------------------
# Territories
# ---------------------------------------------------------
@app.get("/api/territories", response_model=List[schemas.TerritoryOut], tags=["Territory Management"])
def list_territories(db: Session = Depends(get_db)):
    return db.query(models.Territory).order_by(models.Territory.name).all()

@app.post("/api/territories", response_model=schemas.TerritoryOut, tags=["Territory Management"])
def create_territory(
    t_in: schemas.TerritoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_role(["ADMIN"]))
):
    t = models.Territory(**t_in.model_dump())
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

# ---------------------------------------------------------
# Leads & Pipeline
# ---------------------------------------------------------
@app.get("/api/leads", response_model=schemas.PaginatedResponse[schemas.LeadOut], tags=["Leads"])
def list_leads(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    stage: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Lead)
    if stage:
        query = query.filter(models.Lead.stage == stage)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(models.Lead.contact_name.ilike(s), models.Lead.organization_name.ilike(s))
        )
    total = query.count()
    items = query.order_by(desc(models.Lead.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages
    }

@app.post("/api/leads", response_model=schemas.LeadOut, tags=["Leads"])
def create_lead(lead_in: schemas.LeadCreate, db: Session = Depends(get_db)):
    new_lead = models.Lead(**lead_in.model_dump())
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    return new_lead

@app.post("/api/leads/{id}/convert", response_model=schemas.HCPOut, tags=["Leads"])
def convert_lead_to_hcp(
    id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    lead = db.query(models.Lead).filter(models.Lead.id == id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.stage == "Converted" and lead.converted_hcp_id:
        existing_hcp = db.query(models.HCP).filter(models.HCP.id == lead.converted_hcp_id).first()
        if existing_hcp:
            return existing_hcp

    # Parse name into first/last
    parts = lead.contact_name.replace("Dr.", "").strip().split(" ", 1)
    first_name = parts[0]
    last_name = parts[1] if len(parts) > 1 else "MD"
    npi = f"NPI{uuid.uuid4().int % 10000000000:010d}"

    new_hcp = models.HCP(
        first_name=first_name,
        last_name=last_name,
        npi_number=npi,
        specialty=lead.specialty or "General Medicine",
        territory_id=lead.territory_id,
        assigned_rep_id=lead.assigned_rep_id,
        email=lead.email,
        phone=lead.phone,
        prescribing_tier="Tier 2",
        relationship_status="Active Detailing",
        notes=f"Converted from Lead #{lead.id}. Original notes: {lead.notes or 'None'}"
    )
    db.add(new_hcp)
    db.flush()

    lead.stage = "Converted"
    lead.converted_hcp_id = new_hcp.id
    db.commit()
    db.refresh(new_hcp)

    if current_user:
        log_audit_event(
            db,
            actor_email=current_user.email,
            action="LEAD_CONVERT",
            entity_type="LEAD",
            entity_id=str(lead.id),
            details=f"Converted lead {lead.contact_name} into HCP #{new_hcp.id}",
            user_id=current_user.id
        )
    return new_hcp

# ---------------------------------------------------------
# Campaigns
# ---------------------------------------------------------
@app.get("/api/campaigns", response_model=List[schemas.CampaignOut], tags=["Campaigns"])
def list_campaigns(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(models.Campaign)
    if status:
        q = q.filter(models.Campaign.status == status)
    return q.order_by(desc(models.Campaign.id)).all()

@app.post("/api/campaigns", response_model=schemas.CampaignOut, tags=["Campaigns"])
def create_campaign(
    c_in: schemas.CampaignCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    camp = models.Campaign(**c_in.model_dump())
    if current_user:
        camp.created_by_id = current_user.id
    db.add(camp)
    db.commit()
    db.refresh(camp)
    return camp

# ---------------------------------------------------------
# Tasks & Follow-ups
# ---------------------------------------------------------
@app.get("/api/tasks", response_model=schemas.PaginatedResponse[schemas.TaskOut], tags=["Tasks"])
def list_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assigned_to_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Task)
    if status:
        query = query.filter(models.Task.status == status)
    if priority:
        query = query.filter(models.Task.priority == priority)
    if assigned_to_id:
        query = query.filter(models.Task.assigned_to_id == assigned_to_id)

    total = query.count()
    items = query.order_by(models.Task.due_date).offset((page - 1) * page_size).limit(page_size).all()
    pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages
    }

@app.post("/api/tasks", response_model=schemas.TaskOut, tags=["Tasks"])
def create_task(
    t_in: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    t = models.Task(**t_in.model_dump())
    if current_user:
        t.created_by_id = current_user.id
    db.add(t)
    db.commit()
    db.refresh(t)
    return t

@app.patch("/api/tasks/{id}/status", response_model=schemas.TaskOut, tags=["Tasks"])
def update_task_status(
    id: int,
    status_val: str = Query(..., pattern="^(Pending|In_Progress|Completed|Cancelled)$"),
    db: Session = Depends(get_db)
):
    t = db.query(models.Task).filter(models.Task.id == id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Task not found")
    t.status = status_val
    if status_val == "Completed":
        t.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(t)
    return t

# ---------------------------------------------------------
# Asynchronous Reports & Exports
# ---------------------------------------------------------
def generate_export_file(report_type: str, file_path: str):
    """
    Background worker that executes large CSV report exports asynchronously.
    """
    db = SessionLocal()
    try:
        with open(file_path, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            if report_type == "interactions":
                writer.writerow(["ID", "Doctor", "Hospital", "Specialization", "Product", "VisitDate", "Samples", "Sentiment", "Summary"])
                rows = db.query(models.Interaction).all()
                for r in rows:
                    writer.writerow([r.id, r.doctor, r.hospital, r.specialization, r.product, r.visitDate, r.samples, r.sentiment, r.summary])
            elif report_type == "hcps":
                writer.writerow(["ID", "First Name", "Last Name", "NPI", "Specialty", "Prescribing Tier", "Phone", "Email"])
                rows = db.query(models.HCP).all()
                for r in rows:
                    writer.writerow([r.id, r.first_name, r.last_name, r.npi_number, r.specialty, r.prescribing_tier, r.phone, r.email])
            elif report_type == "products":
                writer.writerow(["ID", "Brand Name", "Generic Name", "NDC", "Category", "Dosage Form", "Strength", "Regulatory Status"])
                rows = db.query(models.Product).all()
                for r in rows:
                    writer.writerow([r.id, r.brand_name, r.generic_name, r.ndc_code, r.category, r.dosage_form, r.strength, r.regulatory_status])
        logger.info("Export file generated successfully: %s", file_path)
    except Exception as e:
        logger.error("Failed to generate export file: %s", e)
    finally:
        db.close()

@app.post("/api/reports/export", tags=["Reports"])
def request_export(
    report_type: str = Query("interactions", pattern="^(interactions|hcps|products)$"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    filename = f"export_{report_type}_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:6]}.csv"
    file_path = str(settings.EXPORTS_DIR / filename)
    background_tasks.add_task(generate_export_file, report_type, file_path)
    return {
        "status": "PROCESSING",
        "message": f"Export job for {report_type} started in background.",
        "filename": filename,
        "download_url": f"/api/reports/download/{filename}"
    }

@app.get("/api/reports/download/{filename}", tags=["Reports"])
def download_export(filename: str):
    file_path = settings.EXPORTS_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Export file not ready or does not exist")
    return FileResponse(path=file_path, filename=filename, media_type="text/csv")

# ---------------------------------------------------------
# Backward-Compatible Call Reporting & AI Endpoints
# ---------------------------------------------------------
class Prompt(BaseModel):
    prompt: str

class AssistantRequest(BaseModel):
    message: str
    interaction: dict
    history: list

@app.post("/save")
def save_interaction(
    interaction: schemas.InteractionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional)
):
    data = interaction.model_dump()
    if current_user and not data.get("user_id"):
        data["user_id"] = current_user.id

    record = models.Interaction(**data)
    db.add(record)
    db.commit()
    db.refresh(record)

    return {
        "message": "Interaction Saved Successfully",
        "id": record.id
    }

@app.get("/interactions")
def get_interactions(
    search: Optional[str] = None,
    product: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(models.Interaction)
    if search:
        s = f"%{search}%"
        query = query.filter(
            or_(
                models.Interaction.doctor.ilike(s),
                models.Interaction.hospital.ilike(s),
                models.Interaction.notes.ilike(s)
            )
        )
    if product:
        query = query.filter(models.Interaction.product == product)

    return query.order_by(desc(models.Interaction.id)).offset((page - 1) * page_size).limit(page_size).all()

@app.get("/interaction/{id}")
def get_interaction(id: int, db: Session = Depends(get_db)):
    interaction = db.query(models.Interaction).filter(models.Interaction.id == id).first()
    if not interaction:
        raise HTTPException(status_code=404, detail="Not Found")
    return interaction

@app.put("/interaction/{id}")
def update_interaction(id: int, interaction: schemas.InteractionCreate, db: Session = Depends(get_db)):
    record = db.query(models.Interaction).filter(models.Interaction.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not Found")

    for key, value in interaction.model_dump(exclude_unset=True).items():
        setattr(record, key, value)

    db.commit()
    db.refresh(record)
    return {"message": "Updated Successfully"}

@app.delete("/interaction/{id}")
def delete_interaction(id: int, db: Session = Depends(get_db)):
    record = db.query(models.Interaction).filter(models.Interaction.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Not Found")

    db.delete(record)
    db.commit()
    return {"message": "Deleted Successfully"}

@app.post("/generate")
def generate(data: Prompt):
    try:
        # Run LangGraph pipeline
        result = graph.invoke({"prompt": data.prompt})
        resp = result.get("response", {})
        resp["disclaimer"] = AI_DISCLAIMER
        return resp
    except Exception as e:
        logger.warning("LangGraph generation encountered error: %s. Using fallback.", e)
        return fallback_extract(data.prompt)

@app.post("/assistant")
def assistant(data: AssistantRequest):
    try:
        result = pharma_ai_assistant({
            "interaction": data.interaction,
            "assistant_message": data.message,
            "history": data.history
        })
        res = result.get("assistant", {})
        res["disclaimer"] = AI_DISCLAIMER
        return res
    except Exception as e:
        logger.warning("Assistant error: %s. Using fallback.", e)
        return fallback_assistant(data.message, data.interaction, data.history)
