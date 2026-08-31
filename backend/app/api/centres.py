"""Training Centres API router."""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.centre import TrainingCentre
from app.models.batch import TrainingBatch
from app.models.beneficiary import BeneficiaryEnrolment, Beneficiary
from app.models.anomaly import Anomaly
from app.models.risk import RiskScore
from app.models.inspection import Inspection
from app.models.corrective_action import CorrectiveAction

router = APIRouter(tags=["Centres"])


def centre_with_risk(centre: TrainingCentre, db: Session) -> dict:
    rs = db.query(RiskScore).filter(
        RiskScore.entity_type == "centre",
        RiskScore.entity_id == centre.id,
    ).first()
    open_anomalies = db.query(Anomaly).filter(
        Anomaly.entity_type == "centre",
        Anomaly.entity_id == centre.id,
        Anomaly.status == "open",
    ).count()
    return {
        "id": centre.id,
        "centre_code": centre.centre_code,
        "centre_name": centre.centre_name,
        "organisation_name": centre.organisation_name,
        "state": centre.state,
        "district": centre.district,
        "address": centre.address,
        "latitude": centre.latitude,
        "longitude": centre.longitude,
        "status": centre.status,
        "registration_date": str(centre.registration_date),
        "last_inspection_date": str(centre.last_inspection_date) if centre.last_inspection_date else None,
        "risk_score": rs.score if rs else 0,
        "risk_level": rs.risk_level if rs else "low",
        "open_anomalies": open_anomalies,
    }


@router.get("/centres")
def list_centres(
    state: str = None,
    risk_level: str = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    q = db.query(TrainingCentre)
    if state:
        q = q.filter(TrainingCentre.state == state)
    if status:
        q = q.filter(TrainingCentre.status == status)
    centres = q.all()

    result = [centre_with_risk(c, db) for c in centres]

    if risk_level:
        result = [c for c in result if c["risk_level"] == risk_level]

    result.sort(key=lambda x: x["risk_score"], reverse=True)
    return result


@router.get("/centres/{centre_id}")
def get_centre(centre_id: int, db: Session = Depends(get_db)):
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    return centre_with_risk(centre, db)


@router.get("/centres/{centre_id}/profile")
def get_centre_profile(centre_id: int, db: Session = Depends(get_db)):
    centre = db.query(TrainingCentre).filter(TrainingCentre.id == centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")

    rs = db.query(RiskScore).filter(
        RiskScore.entity_type == "centre", RiskScore.entity_id == centre_id
    ).first()
    reasons = []
    if rs and rs.reasons:
        try:
            reasons = json.loads(rs.reasons)
        except Exception:
            pass

    batches = db.query(TrainingBatch).filter(TrainingBatch.centre_id == centre_id).all()
    batch_ids = [b.id for b in batches]

    anomalies = db.query(Anomaly).filter(
        ((Anomaly.entity_type == "centre") & (Anomaly.entity_id == centre_id)) |
        ((Anomaly.entity_type == "batch") & (Anomaly.entity_id.in_(batch_ids)))
    ).order_by(Anomaly.detected_at.desc()).limit(20).all()

    inspections = db.query(Inspection).filter(
        Inspection.centre_id == centre_id
    ).order_by(Inspection.inspection_date.desc()).all()

    corrective_actions = db.query(CorrectiveAction).filter(
        CorrectiveAction.centre_id == centre_id
    ).all()

    # Beneficiary count
    enrolled_ids = set()
    for b in batches:
        enrols = db.query(BeneficiaryEnrolment).filter(
            BeneficiaryEnrolment.batch_id == b.id
        ).all()
        for e in enrols:
            enrolled_ids.add(e.beneficiary_id)

    return {
        "centre": centre_with_risk(centre, db),
        "risk_score": rs.score if rs else 0,
        "risk_level": rs.risk_level if rs else "low",
        "risk_reasons": reasons,
        "total_batches": len(batches),
        "active_batches": sum(1 for b in batches if b.status == "active"),
        "total_enrolled_beneficiaries": len(enrolled_ids),
        "batches": [
            {
                "id": b.id, "batch_code": b.batch_code, "course_name": b.course_name,
                "start_date": str(b.start_date), "end_date": str(b.end_date),
                "registered_count": b.registered_count, "status": b.status,
            }
            for b in batches
        ],
        "anomalies": [
            {
                "id": a.id, "entity_type": a.entity_type, "anomaly_type": a.anomaly_type,
                "severity": a.severity, "description": a.description,
                "detected_at": str(a.detected_at), "status": a.status,
            }
            for a in anomalies
        ],
        "inspections": [
            {
                "id": i.id, "inspector_name": i.inspector_name,
                "inspection_date": str(i.inspection_date),
                "compliance_status": i.compliance_status, "status": i.status,
                "actual_people_found": i.actual_people_found,
            }
            for i in inspections
        ],
        "corrective_actions": [
            {
                "id": ca.id, "action_required": ca.action_required,
                "deadline": str(ca.deadline), "severity": ca.severity,
                "status": ca.status, "responsible_person": ca.responsible_person,
            }
            for ca in corrective_actions
        ],
    }
