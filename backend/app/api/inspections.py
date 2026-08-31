"""Inspections API router."""
import json
import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.inspection import Inspection
from app.models.centre import TrainingCentre
from app.models.batch import TrainingBatch
from app.services.inspection_prioritizer import get_beneficiary_sample

router = APIRouter(tags=["Inspections"])


def fmt(i: Inspection, db: Session) -> dict:
    findings = {}
    checklist = {}
    try:
        findings = json.loads(i.findings) if i.findings else {}
        checklist = json.loads(i.checklist) if i.checklist else {}
    except Exception:
        pass
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == i.centre_id).first()
    batch = db.query(TrainingBatch).filter(TrainingBatch.id == i.batch_id).first() if i.batch_id else None
    return {
        "id": i.id,
        "centre_id": i.centre_id,
        "centre_name": centre.centre_name if centre else "",
        "centre_code": centre.centre_code if centre else "",
        "batch_id": i.batch_id,
        "batch_code": batch.batch_code if batch else None,
        "inspector_name": i.inspector_name,
        "inspection_date": str(i.inspection_date),
        "actual_people_found": i.actual_people_found,
        "findings": findings,
        "compliance_status": i.compliance_status,
        "status": i.status,
        "duration_minutes": i.duration_minutes,
        "inspector_latitude": i.inspector_latitude,
        "inspector_longitude": i.inspector_longitude,
        "checklist": checklist,
    }


@router.get("/inspections")
def list_inspections(
    centre_id: int = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    q = db.query(Inspection)
    if centre_id:
        q = q.filter(Inspection.centre_id == centre_id)
    if status:
        q = q.filter(Inspection.status == status)
    inspections = q.order_by(Inspection.inspection_date.desc()).all()
    return [fmt(i, db) for i in inspections]


@router.get("/inspections/{inspection_id}")
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    i = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not i:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return fmt(i, db)


@router.post("/inspections")
def create_inspection(data: dict, db: Session = Depends(get_db)):
    centre = db.query(TrainingCentre).filter(
        TrainingCentre.id == data.get("centre_id")
    ).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    i = Inspection(
        centre_id=data["centre_id"],
        batch_id=data.get("batch_id"),
        inspector_name=data.get("inspector_name", "Unknown"),
        inspection_date=datetime.now(),
        findings=json.dumps({}),
        compliance_status="pending",
        status="scheduled",
        checklist=json.dumps({}),
    )
    db.add(i)
    db.commit()
    db.refresh(i)
    return fmt(i, db)


@router.patch("/inspections/{inspection_id}")
def update_inspection(inspection_id: int, data: dict, db: Session = Depends(get_db)):
    i = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not i:
        raise HTTPException(status_code=404, detail="Inspection not found")
    for field in ["status", "actual_people_found", "compliance_status",
                  "duration_minutes", "inspector_latitude", "inspector_longitude"]:
        if field in data:
            setattr(i, field, data[field])
    if "findings" in data:
        i.findings = json.dumps(data["findings"])
    if "checklist" in data:
        i.checklist = json.dumps(data["checklist"])
    db.commit()
    return fmt(i, db)


@router.post("/inspections/{inspection_id}/submit")
def submit_inspection(inspection_id: int, data: dict, db: Session = Depends(get_db)):
    i = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not i:
        raise HTTPException(status_code=404, detail="Inspection not found")
    i.status = "submitted"
    i.actual_people_found = data.get("actual_people_found", i.actual_people_found)
    i.compliance_status = data.get("compliance_status", "partially_compliant")
    if "checklist" in data:
        i.checklist = json.dumps(data["checklist"])
    if "findings" in data:
        i.findings = json.dumps(data["findings"])
    if "duration_minutes" in data:
        i.duration_minutes = data["duration_minutes"]
    db.commit()

    # Update centre's last_inspection_date
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == i.centre_id).first()
    if centre:
        centre.last_inspection_date = datetime.now().date()
        db.commit()

    return {"status": "success", "message": "Inspection submitted successfully", "inspection": fmt(i, db)}


@router.get("/inspections/{inspection_id}/sample")
def get_inspection_sample(
    inspection_id: int,
    sample_size: int = 5,
    db: Session = Depends(get_db)
):
    i = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not i or not i.batch_id:
        raise HTTPException(status_code=404, detail="Inspection or batch not found")
    tokens = get_beneficiary_sample(i.batch_id, sample_size, db)
    return {"sample_size": len(tokens), "beneficiary_tokens": tokens}
