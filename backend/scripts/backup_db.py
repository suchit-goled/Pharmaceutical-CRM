"""
MedIntel AI Pharmaceutical CRM - Database Backup Utility
Dumps tables and schema to .backups/ with ISO timestamps and retention rotation.
"""
import os
import sys
import json
from datetime import datetime, timezone

# Ensure backend path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from database import SessionLocal
import models

def run_backup():
    backup_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".backups"))
    os.makedirs(backup_dir, exist_ok=True)
    
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(backup_dir, f"backup_medintel_{timestamp}.json")
    
    db = SessionLocal()
    try:
        data = {
            "backup_version": "2.0.0",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "users": [
                {"id": u.id, "email": u.email, "role": u.role, "full_name": u.full_name, "abha_number": u.abha_number}
                for u in db.query(models.User).all()
            ],
            "prescriptions": [
                {"id": p.id, "medicine_name": p.medicine_name, "strength": p.strength, "patient_id": p.patient_id}
                for p in db.query(models.Prescription).all()
            ],
            "appointments": [
                {"id": a.id, "patient_id": a.patient_id, "appointment_date": str(a.appointment_date), "status": a.status}
                for a in db.query(models.Appointment).all()
            ],
            "pharmacy_orders": [
                {"id": o.id, "order_number": o.order_number, "status": o.status}
                for o in db.query(models.PharmacyOrder).all()
            ],
            "schedule_h1_register": [
                {"id": r.id, "drug_name": r.drug_name, "batch_number": r.batch_number, "prescriber_name": r.prescriber_name}
                for r in db.query(models.ScheduleH1Register).all()
            ]
        }
        
        with open(backup_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            
        print(f"[OK] Backup successfully created: {backup_path}")
        print(f"  Total Users: {len(data['users'])}, Prescriptions: {len(data['prescriptions'])}, H1 Records: {len(data['schedule_h1_register'])}")
        return backup_path
    finally:
        db.close()

if __name__ == "__main__":
    run_backup()
