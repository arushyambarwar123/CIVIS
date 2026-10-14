"""
CIVIS — Users API router (inspector directory, workloads, user management).
"""
import json
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, InspectorProfile, MonitoringOfficerProfile
from app.models.inspection import Inspection
from app.services.auth_service import get_current_user, require_role

router = APIRouter(prefix="/users", tags=["users"])


def _inspector_summary(user: User, db: Session) -> dict:
    prof = user.inspector_profile
    active = db.query(Inspection).filter(
        Inspection.inspector_name == user.employee_id,
        Inspection.status.in_(["scheduled", "in_progress"]),
    ).count()
    completed = db.query(Inspection).filter(
        Inspection.inspector_name == user.employee_id,
        Inspection.status == "submitted",
    ).count()
    return {
        "id": user.id,
        "employee_id": user.employee_id,
        "name": user.name,
        "region": user.region,
        "status": user.status,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "inspector_id": prof.inspector_id if prof else user.employee_id,
        "assigned_area": prof.assigned_area if prof else None,
        "designation": prof.designation if prof else None,
        "phone": prof.phone if prof else None,
        "active_inspections": active,
        "completed_inspections": completed,
        "workload": active,
    }


@router.get("/inspectors")
def list_inspectors(
    region: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("CENTRAL_ADMIN", "MONITORING_OFFICER")),
):
    q = db.query(User).filter(User.role == "INSPECTOR")

    # MO can only see inspectors in their region
    if current_user.role == "MONITORING_OFFICER":
        q = q.filter(User.region == current_user.region)
    elif region:
        q = q.filter(User.region == region)

    if status:
        q = q.filter(User.status == status)

    users = q.all()
    return [_inspector_summary(u, db) for u in users]


@router.get("/inspectors/{inspector_id}")
def get_inspector(
    inspector_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("CENTRAL_ADMIN", "MONITORING_OFFICER")),
):
    user = db.query(User).filter(User.employee_id == inspector_id).first()
    if not user or user.role != "INSPECTOR":
        raise HTTPException(status_code=404, detail="Inspector not found")

    # MO can only see inspectors in their region
    if current_user.role == "MONITORING_OFFICER" and user.region != current_user.region:
        raise HTTPException(status_code=403, detail="Inspector is outside your jurisdiction")

    return _inspector_summary(user, db)


@router.get("/inspectors/{inspector_id}/workload")
def inspector_workload(
    inspector_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("CENTRAL_ADMIN", "MONITORING_OFFICER")),
):
    user = db.query(User).filter(User.employee_id == inspector_id).first()
    if not user or user.role != "INSPECTOR":
        raise HTTPException(status_code=404, detail="Inspector not found")

    active = db.query(Inspection).filter(
        Inspection.inspector_name == inspector_id,
        Inspection.status.in_(["scheduled", "in_progress"]),
    ).all()

    return {
        "inspector_id": inspector_id,
        "name": user.name,
        "active_inspection_count": len(active),
        "active_inspections": [
            {"id": i.id, "centre_id": i.centre_id, "status": i.status}
            for i in active
        ],
    }


@router.get("/me/inspections")
def my_inspections(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("INSPECTOR")),
):
    """Inspector: retrieve only inspections assigned to me."""
    q = db.query(Inspection).filter(
        Inspection.inspector_name == current_user.employee_id
    )
    if status:
        q = q.filter(Inspection.status == status)
    inspections = q.order_by(Inspection.inspection_date.desc()).all()
    return [
        {
            "id": i.id,
            "centre_id": i.centre_id,
            "batch_id": i.batch_id,
            "inspection_date": i.inspection_date.isoformat() if i.inspection_date else None,
            "compliance_status": i.compliance_status,
            "status": i.status,
            "duration_minutes": i.duration_minutes,
        }
        for i in inspections
    ]


@router.patch("/{user_id}/status")
def update_user_status(
    user_id: int,
    body: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("CENTRAL_ADMIN")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    new_status = body.get("status")
    if new_status not in ("ACTIVE", "INACTIVE", "SUSPENDED"):
        raise HTTPException(status_code=422, detail="Invalid status value")
    user.status = new_status
    db.commit()
    return {"message": f"User {user.employee_id} status updated to {new_status}"}


@router.get("/")
def list_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("CENTRAL_ADMIN")),
):
    users = db.query(User).all()
    return [
        {
            "id": u.id,
            "employee_id": u.employee_id,
            "name": u.name,
            "role": u.role,
            "region": u.region,
            "status": u.status,
            "last_login": u.last_login.isoformat() if u.last_login else None,
        }
        for u in users
    ]
