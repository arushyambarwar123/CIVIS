"""Anomalies API router."""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.anomaly import Anomaly

router = APIRouter(tags=["Anomalies"])

RECOMMENDED_ACTIONS = {
    "duplicate_evidence": "Physical verification recommended. Request original monitoring evidence with timestamps and geo-tags.",
    "perfect_attendance_pattern": "Physical inspection recommended. Verify actual beneficiary presence through random sampling.",
    "identical_checkin_time": "Audit biometric/attendance system. Verify timestamps are not bulk-entered.",
    "attendance_geo_mismatch": "Verify GPS coordinates of training centre. Cross-check beneficiary attendance location.",
    "impossible_travel": "Immediate physical verification at both centres. Verify beneficiary identity records.",
    "trainer_conflict": "Verify trainer's actual schedule. Request trainer attendance logs from both centres.",
    "placement_without_certification": "Hold placement claims pending certification verification.",
    "placement_before_completion": "Verify if early completion was approved. Review placement records.",
    "duplicate_employer_concentration": "Review employer verification. Conduct direct employer contact verification.",
    "unverified_placement_pending": "Escalate placement verification. Contact employer directly.",
    "payment_low_attendance": "Suspend further payments. Verify attendance records before releasing pending amounts.",
    "payment_before_batch_start": "Audit payment release process. Verify authorisation trail.",
    "payment_inactive_batch": "Investigate payment authorisation. Hold and review payments.",
    "payment_unenrolled_beneficiary": "Stop payment. Verify beneficiary enrolment records immediately.",
    "duplicate_payment_reference": "Investigate duplicate reference. Check for double payment.",
    "payment_after_dropout": "Recover payment if incorrectly released. Verify dropout date.",
    "inspection_overdue": "Schedule physical inspection at the earliest.",
    "beneficiary_match_high": "Verify beneficiary identity documents to confirm uniqueness.",
    "duplicate_enrolment_match": "Physical verification recommended at both centres.",
    "eligibility_mismatch": "Verify beneficiary eligibility documents. Hold enrolment pending review.",
}


def format_anomaly(a: Anomaly) -> dict:
    ev = {}
    try:
        ev = json.loads(a.evidence) if a.evidence else {}
    except Exception:
        pass
    return {
        "id": a.id,
        "entity_type": a.entity_type,
        "entity_id": a.entity_id,
        "anomaly_type": a.anomaly_type,
        "severity": a.severity,
        "description": a.description,
        "detected_at": str(a.detected_at),
        "evidence": ev,
        "status": a.status,
        "related_entity_type": a.related_entity_type,
        "related_entity_id": a.related_entity_id,
        "recommended_action": RECOMMENDED_ACTIONS.get(a.anomaly_type, "Review the flagged record and schedule verification if required."),
    }


@router.get("/anomalies")
def list_anomalies(
    entity_type: str = None,
    severity: str = None,
    status: str = None,
    anomaly_type: str = None,
    centre_id: int = None,
    batch_id: int = None,
    db: Session = Depends(get_db),
):
    q = db.query(Anomaly)
    if entity_type:
        q = q.filter(Anomaly.entity_type == entity_type)
    if severity:
        q = q.filter(Anomaly.severity == severity)
    if status:
        q = q.filter(Anomaly.status == status)
    if anomaly_type:
        q = q.filter(Anomaly.anomaly_type == anomaly_type)
    if batch_id:
        q = q.filter(Anomaly.entity_type == "batch", Anomaly.entity_id == batch_id)
    if centre_id:
        from app.models.batch import TrainingBatch
        batch_ids = [b.id for b in db.query(TrainingBatch).filter(
            TrainingBatch.centre_id == centre_id
        ).all()]
        q = q.filter(
            ((Anomaly.entity_type == "centre") & (Anomaly.entity_id == centre_id)) |
            ((Anomaly.entity_type == "batch") & (Anomaly.entity_id.in_(batch_ids)))
        )

    severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
    anomalies = q.order_by(Anomaly.detected_at.desc()).all()
    anomalies.sort(key=lambda a: severity_order.get(a.severity, 4))
    return [format_anomaly(a) for a in anomalies]


@router.get("/anomalies/{anomaly_id}")
def get_anomaly(anomaly_id: int, db: Session = Depends(get_db)):
    a = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    return format_anomaly(a)


@router.patch("/anomalies/{anomaly_id}")
def update_anomaly_status(anomaly_id: int, data: dict, db: Session = Depends(get_db)):
    a = db.query(Anomaly).filter(Anomaly.id == anomaly_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Anomaly not found")
    if "status" in data:
        a.status = data["status"]
    db.commit()
    return format_anomaly(a)
