"""Corrective Actions router."""
import json
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.corrective_action import CorrectiveAction

router = APIRouter(tags=["Corrective Actions"])


def fmt(ca: CorrectiveAction) -> dict:
    return {
        "id": ca.id,
        "anomaly_id": ca.anomaly_id,
        "inspection_id": ca.inspection_id,
        "centre_id": ca.centre_id,
        "responsible_person": ca.responsible_person,
        "action_required": ca.action_required,
        "deadline": str(ca.deadline),
        "severity": ca.severity,
        "status": ca.status,
        "evidence_submitted": ca.evidence_submitted,
        "verified": ca.verified,
        "created_at": str(ca.created_at),
        "is_overdue": ca.deadline < date.today() and ca.status not in ("closed", "verified"),
    }


@router.get("/corrective-actions")
def list_corrective_actions(
    status: str = None,
    centre_id: int = None,
    severity: str = None,
    db: Session = Depends(get_db),
):
    q = db.query(CorrectiveAction)
    if status:
        q = q.filter(CorrectiveAction.status == status)
    if centre_id:
        q = q.filter(CorrectiveAction.centre_id == centre_id)
    if severity:
        q = q.filter(CorrectiveAction.severity == severity)

    # Auto-mark overdue
    all_cas = q.all()
    for ca in all_cas:
        if ca.deadline < date.today() and ca.status in ("open", "in_progress"):
            ca.status = "overdue"
    db.commit()

    return [fmt(ca) for ca in all_cas]


@router.get("/corrective-actions/overdue")
def list_overdue(db: Session = Depends(get_db)):
    cas = db.query(CorrectiveAction).filter(
        CorrectiveAction.status.in_(["open", "in_progress", "overdue"])
    ).all()
    today = date.today()
    overdue = [ca for ca in cas if ca.deadline < today]
    for ca in overdue:
        ca.status = "overdue"
    db.commit()
    return [fmt(ca) for ca in overdue]


@router.post("/corrective-actions")
def create_corrective_action(data: dict, db: Session = Depends(get_db)):
    ca = CorrectiveAction(
        anomaly_id=data.get("anomaly_id"),
        inspection_id=data.get("inspection_id"),
        centre_id=data.get("centre_id"),
        responsible_person=data.get("responsible_person", "To be assigned"),
        action_required=data.get("action_required", ""),
        deadline=date.fromisoformat(data.get("deadline", str(date.today()))),
        severity=data.get("severity", "medium"),
        status="open",
        verified=False,
        created_at=datetime.now(),
    )
    db.add(ca)
    db.commit()
    db.refresh(ca)
    return fmt(ca)


@router.patch("/corrective-actions/{ca_id}")
def update_corrective_action(ca_id: int, data: dict, db: Session = Depends(get_db)):
    ca = db.query(CorrectiveAction).filter(CorrectiveAction.id == ca_id).first()
    if not ca:
        raise HTTPException(status_code=404, detail="Corrective action not found")
    for field in ["status", "evidence_submitted", "verified", "responsible_person"]:
        if field in data:
            setattr(ca, field, data[field])
    db.commit()
    return fmt(ca)
