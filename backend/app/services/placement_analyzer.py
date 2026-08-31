"""
Placement Analyzer — detects suspicious placement patterns.
Checks: placement without certification, before course end, employer concentration,
threshold-edge reporting, long-pending unverified placements.
"""
import json
from datetime import datetime, date, timedelta
from collections import Counter
from sqlalchemy.orm import Session

from app.models.placement import Placement
from app.models.assessment import Assessment
from app.models.batch import TrainingBatch
from app.models.anomaly import Anomaly


def _clear_placement_anomalies(db: Session):
    db.query(Anomaly).filter(
        Anomaly.anomaly_type.in_([
            "placement_without_certification",
            "placement_before_completion",
            "duplicate_employer_concentration",
            "threshold_edge_pattern",
            "unverified_placement_pending",
        ])
    ).delete(synchronize_session=False)
    db.commit()


def check_placement_without_certification(db: Session) -> list[dict]:
    """Flag placements where beneficiary is not certified."""
    anomalies = []
    placements = db.query(Placement).all()

    for p in placements:
        assessment = db.query(Assessment).filter(
            Assessment.beneficiary_id == p.beneficiary_id,
            Assessment.batch_id == p.batch_id,
        ).first()

        if not assessment or assessment.certification_status != "certified":
            cert_status = assessment.certification_status if assessment else "no_assessment"
            desc = (
                f"Placement claimed for beneficiary {p.beneficiary_id} who is not certified "
                f"(certification_status: {cert_status})"
            )
            db.add(Anomaly(
                entity_type="batch",
                entity_id=p.batch_id,
                anomaly_type="placement_without_certification",
                severity="high",
                description=desc,
                detected_at=datetime.now(),
                evidence=json.dumps({
                    "placement_id": p.id,
                    "beneficiary_id": p.beneficiary_id,
                    "certification_status": cert_status,
                }),
                status="open",
            ))
            anomalies.append({"placement_id": p.id})

    db.commit()
    return anomalies


def check_placement_before_completion(db: Session) -> list[dict]:
    """Flag placements dated before the batch end date."""
    anomalies = []
    placements = db.query(Placement).all()

    for p in placements:
        batch = db.query(TrainingBatch).filter(TrainingBatch.id == p.batch_id).first()
        if not batch:
            continue
        if p.placement_date < batch.end_date:
            days_before = (batch.end_date - p.placement_date).days
            desc = (
                f"Placement date ({p.placement_date}) is {days_before} days BEFORE "
                f"batch end date ({batch.end_date}) for batch {batch.batch_code}"
            )
            db.add(Anomaly(
                entity_type="batch",
                entity_id=p.batch_id,
                anomaly_type="placement_before_completion",
                severity="high",
                description=desc,
                detected_at=datetime.now(),
                evidence=json.dumps({
                    "placement_id": p.id,
                    "placement_date": str(p.placement_date),
                    "batch_end_date": str(batch.end_date),
                    "days_before": days_before,
                }),
                status="open",
            ))
            anomalies.append({"placement_id": p.id, "batch_code": batch.batch_code})

    db.commit()
    return anomalies


def check_employer_concentration(db: Session) -> list[dict]:
    """Flag batches where >40% of placements are at the same employer."""
    anomalies = []
    batches = db.query(TrainingBatch).all()

    for batch in batches:
        placements = db.query(Placement).filter(Placement.batch_id == batch.id).all()
        if len(placements) < 5:
            continue

        employer_counts = Counter(p.employer_name for p in placements)
        for employer, count in employer_counts.items():
            pct = count / len(placements) * 100
            if pct > 40:
                desc = (
                    f"Unusual employer concentration: {count}/{len(placements)} placements "
                    f"({pct:.0f}%) in batch {batch.batch_code} assigned to '{employer}'"
                )
                db.add(Anomaly(
                    entity_type="batch",
                    entity_id=batch.id,
                    anomaly_type="duplicate_employer_concentration",
                    severity="medium",
                    description=desc,
                    detected_at=datetime.now(),
                    evidence=json.dumps({
                        "employer": employer,
                        "count": count,
                        "total_placements": len(placements),
                        "percentage": pct,
                    }),
                    status="open",
                ))
                anomalies.append({"batch_id": batch.id, "employer": employer})

    db.commit()
    return anomalies


def check_unverified_placements(db: Session, days_threshold: int = 90) -> list[dict]:
    """Flag placements that have been unverified for a long time."""
    anomalies = []
    cutoff = date.today() - timedelta(days=days_threshold)
    old_pending = db.query(Placement).filter(
        Placement.verification_status == "pending",
        Placement.placement_date <= cutoff,
    ).all()

    if old_pending:
        batch_groups: dict = {}
        for p in old_pending:
            if p.batch_id not in batch_groups:
                batch_groups[p.batch_id] = []
            batch_groups[p.batch_id].append(p)

        for batch_id, placements in batch_groups.items():
            desc = (
                f"{len(placements)} placements in batch {batch_id} have been "
                f"unverified for >{days_threshold} days"
            )
            db.add(Anomaly(
                entity_type="batch",
                entity_id=batch_id,
                anomaly_type="unverified_placement_pending",
                severity="medium",
                description=desc,
                detected_at=datetime.now(),
                evidence=json.dumps({
                    "count": len(placements),
                    "days_threshold": days_threshold,
                }),
                status="open",
            ))
            anomalies.append({"batch_id": batch_id, "count": len(placements)})

    db.commit()
    return anomalies


def analyze_placements(db: Session) -> dict:
    _clear_placement_anomalies(db)
    return {
        "without_certification": len(check_placement_without_certification(db)),
        "before_completion": len(check_placement_before_completion(db)),
        "employer_concentration": len(check_employer_concentration(db)),
        "unverified_pending": len(check_unverified_placements(db)),
    }
