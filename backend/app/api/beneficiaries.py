"""Beneficiaries API router."""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.beneficiary import Beneficiary, BeneficiaryEnrolment
from app.models.attendance import Attendance
from app.models.assessment import Assessment
from app.models.placement import Placement
from app.models.payment import Payment
from app.models.anomaly import Anomaly
from app.models.batch import TrainingBatch

router = APIRouter(tags=["Beneficiaries"])


@router.get("/beneficiaries")
def list_beneficiaries(
    state: str = None,
    district: str = None,
    eligibility_status: bool = None,
    db: Session = Depends(get_db)
):
    q = db.query(Beneficiary)
    if state:
        q = q.filter(Beneficiary.state == state)
    if district:
        q = q.filter(Beneficiary.district == district)
    if eligibility_status is not None:
        q = q.filter(Beneficiary.eligibility_status == eligibility_status)
    bens = q.all()

    result = []
    for b in bens:
        open_anomalies = db.query(Anomaly).filter(
            Anomaly.entity_type == "beneficiary",
            Anomaly.entity_id == b.id,
            Anomaly.status == "open",
        ).count()
        enrolments = db.query(BeneficiaryEnrolment).filter(
            BeneficiaryEnrolment.beneficiary_id == b.id
        ).count()
        result.append({
            "id": b.id,
            "beneficiary_token": b.beneficiary_token,
            "name": b.name,
            "age": b.age,
            "gender": b.gender,
            "category": b.category,
            "district": b.district,
            "state": b.state,
            "eligibility_status": b.eligibility_status,
            "bank_account_token": b.bank_account_token,
            "mobile_token": b.mobile_token,
            "open_anomalies": open_anomalies,
            "enrolment_count": enrolments,
        })
    return result


@router.get("/beneficiaries/{beneficiary_id}")
def get_beneficiary(beneficiary_id: int, db: Session = Depends(get_db)):
    ben = db.query(Beneficiary).filter(Beneficiary.id == beneficiary_id).first()
    if not ben:
        raise HTTPException(status_code=404, detail="Beneficiary not found")

    enrolments = db.query(BeneficiaryEnrolment).filter(
        BeneficiaryEnrolment.beneficiary_id == beneficiary_id
    ).all()

    batch_ids = [e.batch_id for e in enrolments]

    # Attendance summary per batch
    att_summary = []
    for batch_id in batch_ids:
        total = db.query(Attendance).filter(
            Attendance.beneficiary_id == beneficiary_id,
            Attendance.batch_id == batch_id,
        ).count()
        present = db.query(Attendance).filter(
            Attendance.beneficiary_id == beneficiary_id,
            Attendance.batch_id == batch_id,
            Attendance.attendance_status == "present",
        ).count()
        batch = db.query(TrainingBatch).filter(TrainingBatch.id == batch_id).first()
        att_summary.append({
            "batch_id": batch_id,
            "batch_code": batch.batch_code if batch else str(batch_id),
            "total_days": total,
            "present_days": present,
            "attendance_pct": round(present / total * 100, 1) if total else 0,
        })

    assessments = db.query(Assessment).filter(
        Assessment.beneficiary_id == beneficiary_id
    ).all()
    placements = db.query(Placement).filter(
        Placement.beneficiary_id == beneficiary_id
    ).all()
    payments = db.query(Payment).filter(
        Payment.beneficiary_id == beneficiary_id
    ).all()
    anomalies = db.query(Anomaly).filter(
        Anomaly.entity_type == "beneficiary",
        Anomaly.entity_id == beneficiary_id,
    ).all()

    return {
        "id": ben.id,
        "beneficiary_token": ben.beneficiary_token,
        "name": ben.name,
        "age": ben.age,
        "gender": ben.gender,
        "category": ben.category,
        "district": ben.district,
        "state": ben.state,
        "eligibility_status": ben.eligibility_status,
        "bank_account_token": ben.bank_account_token,
        "mobile_token": ben.mobile_token,
        "enrolments": [
            {
                "id": e.id, "batch_id": e.batch_id, "enrolment_date": str(e.enrolment_date),
                "status": e.status, "completion_status": e.completion_status,
            }
            for e in enrolments
        ],
        "attendance_summary": att_summary,
        "assessments": [
            {
                "id": a.id, "batch_id": a.batch_id, "score": a.score,
                "result": a.result, "assessment_date": str(a.assessment_date),
                "certification_status": a.certification_status,
            }
            for a in assessments
        ],
        "placements": [
            {
                "id": p.id, "batch_id": p.batch_id, "employer_name": p.employer_name,
                "employment_type": p.employment_type, "placement_date": str(p.placement_date),
                "salary": p.salary, "verification_status": p.verification_status,
            }
            for p in placements
        ],
        "payments": [
            {
                "id": p.id, "batch_id": p.batch_id, "payment_type": p.payment_type,
                "amount": p.amount, "payment_date": str(p.payment_date),
                "payment_status": p.payment_status,
            }
            for p in payments
        ],
        "anomalies": [
            {
                "id": a.id, "anomaly_type": a.anomaly_type, "severity": a.severity,
                "description": a.description, "detected_at": str(a.detected_at),
                "status": a.status,
                "evidence": json.loads(a.evidence) if a.evidence else {},
            }
            for a in anomalies
        ],
    }
