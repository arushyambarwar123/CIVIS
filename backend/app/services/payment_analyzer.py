"""
Payment Analyzer — detects suspicious payment patterns.
Checks: stipend vs attendance, payment before batch start, payment on inactive batch,
unenrolled beneficiary payments, duplicate references, payment after dropout.
"""
import json
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.models.attendance import Attendance
from app.models.batch import TrainingBatch
from app.models.beneficiary import BeneficiaryEnrolment
from app.models.anomaly import Anomaly


def _clear_payment_anomalies(db: Session):
    db.query(Anomaly).filter(
        Anomaly.anomaly_type.in_([
            "payment_low_attendance",
            "payment_before_batch_start",
            "payment_inactive_batch",
            "payment_unenrolled_beneficiary",
            "duplicate_payment_reference",
            "payment_after_dropout",
        ])
    ).delete(synchronize_session=False)
    db.commit()


def check_payment_vs_attendance(db: Session, min_attendance_pct: float = 80) -> list[dict]:
    """Flag stipend payments where beneficiary attendance is below minimum threshold."""
    anomalies = []
    stipend_payments = db.query(Payment).filter(
        Payment.payment_type == "stipend",
        Payment.payment_status == "paid",
    ).all()

    for p in stipend_payments:
        # Calculate attendance for this beneficiary in this batch
        total_days = db.query(Attendance).filter(
            Attendance.batch_id == p.batch_id,
            Attendance.beneficiary_id == p.beneficiary_id,
        ).count()
        present_days = db.query(Attendance).filter(
            Attendance.batch_id == p.batch_id,
            Attendance.beneficiary_id == p.beneficiary_id,
            Attendance.attendance_status == "present",
        ).count()

        if total_days == 0:
            continue

        att_pct = (present_days / total_days) * 100
        if att_pct < min_attendance_pct:
            desc = (
                f"Stipend paid to beneficiary {p.beneficiary_id} with only {att_pct:.0f}% attendance "
                f"(minimum required: {min_attendance_pct}%)"
            )
            db.add(Anomaly(
                entity_type="batch",
                entity_id=p.batch_id,
                anomaly_type="payment_low_attendance",
                severity="high",
                description=desc,
                detected_at=datetime.now(),
                evidence=json.dumps({
                    "payment_id": p.id,
                    "beneficiary_id": p.beneficiary_id,
                    "attendance_pct": round(att_pct, 1),
                    "min_required": min_attendance_pct,
                    "amount": p.amount,
                }),
                status="open",
            ))
            anomalies.append({"payment_id": p.id})

    db.commit()
    return anomalies


def check_payment_before_batch_start(db: Session) -> list[dict]:
    """Flag payments made before the batch start date."""
    anomalies = []
    payments = db.query(Payment).filter(Payment.payment_status == "paid").all()

    for p in payments:
        batch = db.query(TrainingBatch).filter(TrainingBatch.id == p.batch_id).first()
        if not batch:
            continue
        if p.payment_date < batch.start_date:
            desc = (
                f"Payment released {(batch.start_date - p.payment_date).days} days "
                f"BEFORE batch start date ({batch.start_date})"
            )
            db.add(Anomaly(
                entity_type="batch",
                entity_id=p.batch_id,
                anomaly_type="payment_before_batch_start",
                severity="medium",
                description=desc,
                detected_at=datetime.now(),
                evidence=json.dumps({
                    "payment_id": p.id,
                    "payment_date": str(p.payment_date),
                    "batch_start_date": str(batch.start_date),
                }),
                status="open",
            ))
            anomalies.append({"payment_id": p.id})

    db.commit()
    return anomalies


def check_payment_inactive_batch(db: Session) -> list[dict]:
    """Flag payments on cancelled batches."""
    anomalies = []
    cancelled_batches = db.query(TrainingBatch).filter(TrainingBatch.status == "cancelled").all()

    for batch in cancelled_batches:
        payments = db.query(Payment).filter(
            Payment.batch_id == batch.id,
            Payment.payment_status == "paid",
        ).all()
        if payments:
            desc = (
                f"{len(payments)} payment(s) released for cancelled batch {batch.batch_code}"
            )
            db.add(Anomaly(
                entity_type="batch",
                entity_id=batch.id,
                anomaly_type="payment_inactive_batch",
                severity="high",
                description=desc,
                detected_at=datetime.now(),
                evidence=json.dumps({
                    "batch_code": batch.batch_code,
                    "payment_count": len(payments),
                    "total_amount": sum(p.amount for p in payments),
                }),
                status="open",
            ))
            anomalies.append({"batch_id": batch.id, "payment_count": len(payments)})

    db.commit()
    return anomalies


def check_unenrolled_payments(db: Session) -> list[dict]:
    """Flag payments to beneficiaries not enrolled in the batch."""
    anomalies = []
    payments = db.query(Payment).filter(Payment.payment_status == "paid").all()

    for p in payments:
        enrolment = db.query(BeneficiaryEnrolment).filter(
            BeneficiaryEnrolment.batch_id == p.batch_id,
            BeneficiaryEnrolment.beneficiary_id == p.beneficiary_id,
        ).first()
        if not enrolment:
            desc = (
                f"Payment to beneficiary {p.beneficiary_id} who has no enrolment record in batch {p.batch_id}"
            )
            db.add(Anomaly(
                entity_type="batch",
                entity_id=p.batch_id,
                anomaly_type="payment_unenrolled_beneficiary",
                severity="critical",
                description=desc,
                detected_at=datetime.now(),
                evidence=json.dumps({
                    "payment_id": p.id,
                    "beneficiary_id": p.beneficiary_id,
                    "amount": p.amount,
                }),
                status="open",
            ))
            anomalies.append({"payment_id": p.id})

    db.commit()
    return anomalies


def check_duplicate_payment_references(db: Session) -> list[dict]:
    """Flag duplicate payment references within the same batch."""
    anomalies = []
    payments_with_ref = db.query(Payment).filter(
        Payment.payment_reference.isnot(None),
        Payment.payment_status == "paid",
    ).all()

    ref_map: dict = {}
    for p in payments_with_ref:
        key = (p.batch_id, p.payment_reference)
        if key not in ref_map:
            ref_map[key] = []
        ref_map[key].append(p.id)

    for (batch_id, ref), payment_ids in ref_map.items():
        if len(payment_ids) > 1:
            desc = f"Duplicate payment reference '{ref}' used for {len(payment_ids)} payments in batch {batch_id}"
            db.add(Anomaly(
                entity_type="batch",
                entity_id=batch_id,
                anomaly_type="duplicate_payment_reference",
                severity="high",
                description=desc,
                detected_at=datetime.now(),
                evidence=json.dumps({"reference": ref, "payment_ids": payment_ids}),
                status="open",
            ))
            anomalies.append({"batch_id": batch_id, "reference": ref})

    db.commit()
    return anomalies


def check_payment_after_dropout(db: Session) -> list[dict]:
    """Flag stipend payments to beneficiaries who have dropped out."""
    anomalies = []
    dropout_enrolments = db.query(BeneficiaryEnrolment).filter(
        BeneficiaryEnrolment.status == "dropout"
    ).all()

    for enrolment in dropout_enrolments:
        payments = db.query(Payment).filter(
            Payment.beneficiary_id == enrolment.beneficiary_id,
            Payment.batch_id == enrolment.batch_id,
            Payment.payment_status == "paid",
        ).all()
        for p in payments:
            desc = (
                f"Payment of {p.amount} to beneficiary {p.beneficiary_id} "
                f"who has dropout status in batch {p.batch_id}"
            )
            db.add(Anomaly(
                entity_type="batch",
                entity_id=p.batch_id,
                anomaly_type="payment_after_dropout",
                severity="high",
                description=desc,
                detected_at=datetime.now(),
                evidence=json.dumps({
                    "payment_id": p.id,
                    "beneficiary_id": p.beneficiary_id,
                    "amount": p.amount,
                }),
                status="open",
            ))
            anomalies.append({"payment_id": p.id})

    db.commit()
    return anomalies


def analyze_payments(db: Session, cfg: dict = None) -> dict:
    if cfg is None:
        cfg = {"min_attendance_pct": 80}

    _clear_payment_anomalies(db)

    return {
        "low_attendance_stipend": len(check_payment_vs_attendance(db, cfg.get("min_attendance_pct", 80))),
        "before_batch_start": len(check_payment_before_batch_start(db)),
        "inactive_batch": len(check_payment_inactive_batch(db)),
        "unenrolled": len(check_unenrolled_payments(db)),
        "duplicate_references": len(check_duplicate_payment_references(db)),
        "after_dropout": len(check_payment_after_dropout(db)),
    }
