"""Batches API router."""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.batch import TrainingBatch
from app.models.beneficiary import BeneficiaryEnrolment, Beneficiary
from app.models.attendance import Attendance
from app.models.assessment import Assessment
from app.models.anomaly import Anomaly
from app.models.risk import RiskScore

router = APIRouter(tags=["Batches"])


@router.get("/batches")
def list_batches(
    centre_id: int = None,
    status: str = None,
    course_name: str = None,
    db: Session = Depends(get_db)
):
    q = db.query(TrainingBatch)
    if centre_id:
        q = q.filter(TrainingBatch.centre_id == centre_id)
    if status:
        q = q.filter(TrainingBatch.status == status)
    batches = q.all()

    result = []
    for b in batches:
        rs = db.query(RiskScore).filter(
            RiskScore.entity_type == "batch", RiskScore.entity_id == b.id
        ).first()
        open_anomalies = db.query(Anomaly).filter(
            Anomaly.entity_type == "batch",
            Anomaly.entity_id == b.id,
            Anomaly.status == "open",
        ).count()
        result.append({
            "id": b.id,
            "batch_code": b.batch_code,
            "centre_id": b.centre_id,
            "course_name": b.course_name,
            "trainer_id": b.trainer_id,
            "start_date": str(b.start_date),
            "end_date": str(b.end_date),
            "expected_training_hours": b.expected_training_hours,
            "batch_capacity": b.batch_capacity,
            "registered_count": b.registered_count,
            "status": b.status,
            "risk_score": rs.score if rs else 0,
            "risk_level": rs.risk_level if rs else "low",
            "open_anomalies": open_anomalies,
        })

    result.sort(key=lambda x: x["risk_score"], reverse=True)
    return result


@router.get("/batches/{batch_id}")
def get_batch(batch_id: int, db: Session = Depends(get_db)):
    batch = db.query(TrainingBatch).filter(TrainingBatch.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    enrolments = db.query(BeneficiaryEnrolment).filter(
        BeneficiaryEnrolment.batch_id == batch_id
    ).all()
    ben_ids = [e.beneficiary_id for e in enrolments]

    total_present = db.query(Attendance).filter(
        Attendance.batch_id == batch_id,
        Attendance.attendance_status == "present",
    ).count()
    total_att = db.query(Attendance).filter(Attendance.batch_id == batch_id).count()

    pass_count = db.query(Assessment).filter(
        Assessment.batch_id == batch_id,
        Assessment.result == "pass",
    ).count()
    total_assessed = db.query(Assessment).filter(Assessment.batch_id == batch_id).count()

    anomalies = db.query(Anomaly).filter(
        Anomaly.entity_type == "batch",
        Anomaly.entity_id == batch_id,
        Anomaly.status == "open",
    ).all()

    rs = db.query(RiskScore).filter(
        RiskScore.entity_type == "batch", RiskScore.entity_id == batch_id
    ).first()

    return {
        "id": batch.id,
        "batch_code": batch.batch_code,
        "centre_id": batch.centre_id,
        "course_name": batch.course_name,
        "trainer_id": batch.trainer_id,
        "start_date": str(batch.start_date),
        "end_date": str(batch.end_date),
        "expected_training_hours": batch.expected_training_hours,
        "batch_capacity": batch.batch_capacity,
        "registered_count": batch.registered_count,
        "status": batch.status,
        "enrolled_count": len(enrolments),
        "attendance_pct": round(total_present / total_att * 100, 1) if total_att else 0,
        "pass_count": pass_count,
        "total_assessed": total_assessed,
        "risk_score": rs.score if rs else 0,
        "risk_level": rs.risk_level if rs else "low",
        "open_anomalies": len(anomalies),
        "anomalies": [
            {"id": a.id, "anomaly_type": a.anomaly_type, "severity": a.severity,
             "description": a.description, "status": a.status}
            for a in anomalies
        ],
    }
