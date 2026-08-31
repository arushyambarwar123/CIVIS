"""
Inspection Prioritizer — ranks training centres by inspection urgency.
Score = risk_score * 0.5 + inspection_age_factor * 0.3 + critical_anomaly_count * 10 * 0.2
"""
import random
from datetime import datetime
from sqlalchemy.orm import Session

from app.models.centre import TrainingCentre
from app.models.risk import RiskScore
from app.models.anomaly import Anomaly
from app.models.corrective_action import CorrectiveAction
from app.models.beneficiary import BeneficiaryEnrolment
from app.models.batch import TrainingBatch


def get_priority_list(db: Session) -> list[dict]:
    centres = db.query(TrainingCentre).filter(TrainingCentre.status == "active").all()
    today = datetime.now().date()
    results = []

    for centre in centres:
        # Risk score
        rs = db.query(RiskScore).filter(
            RiskScore.entity_type == "centre",
            RiskScore.entity_id == centre.id,
        ).first()
        risk_score = rs.score if rs else 0

        # Inspection age factor (0-100)
        if centre.last_inspection_date:
            days_since = (today - centre.last_inspection_date).days
        else:
            days_since = 999
        inspection_age_factor = min(100, days_since / 3.65)

        # Critical anomaly count
        critical_count = db.query(Anomaly).filter(
            Anomaly.entity_type == "centre",
            Anomaly.entity_id == centre.id,
            Anomaly.severity == "critical",
            Anomaly.status == "open",
        ).count()
        # Also count batch anomalies for this centre's batches
        batch_ids = [b.id for b in db.query(TrainingBatch).filter(TrainingBatch.centre_id == centre.id).all()]
        if batch_ids:
            critical_count += db.query(Anomaly).filter(
                Anomaly.entity_type == "batch",
                Anomaly.entity_id.in_(batch_ids),
                Anomaly.severity == "critical",
                Anomaly.status == "open",
            ).count()

        # Pending corrective actions
        pending_actions = db.query(CorrectiveAction).filter(
            CorrectiveAction.centre_id == centre.id,
            CorrectiveAction.status.in_(["open", "in_progress", "overdue"]),
        ).count()

        # Composite priority score
        priority_score = (
            risk_score * 0.5
            + inspection_age_factor * 0.3
            + critical_count * 10 * 0.2
        )

        # Build human-readable reasons
        reasons = []
        if risk_score >= 76:
            reasons.append(f"Critical risk score ({risk_score:.0f})")
        elif risk_score >= 56:
            reasons.append(f"High risk score ({risk_score:.0f})")
        if days_since >= 365:
            reasons.append(f"Inspection overdue ({days_since} days)")
        if critical_count > 0:
            reasons.append(f"{critical_count} critical anomaly(ies)")
        if pending_actions > 0:
            reasons.append(f"{pending_actions} pending action(s)")
        if not reasons:
            reasons.append("Routine priority")

        results.append({
            "centre_id": centre.id,
            "centre_name": centre.centre_name,
            "centre_code": centre.centre_code,
            "district": centre.district,
            "state": centre.state,
            "risk_score": risk_score,
            "risk_level": rs.risk_level if rs else "low",
            "days_since_inspection": days_since,
            "critical_anomaly_count": critical_count,
            "pending_actions": pending_actions,
            "priority_score": round(priority_score, 1),
            "priority_reasons": reasons,
            "last_inspection_date": str(centre.last_inspection_date) if centre.last_inspection_date else None,
        })

    results.sort(key=lambda x: x["priority_score"], reverse=True)
    for i, r in enumerate(results):
        r["rank"] = i + 1

    return results


def generate_random_sample(db: Session, count: int = 3, from_medium_plus: bool = False) -> list[dict]:
    """Generate a random sample of centres for inspection."""
    centres = db.query(TrainingCentre).filter(TrainingCentre.status == "active").all()

    if from_medium_plus:
        medium_plus_ids = set()
        risk_scores = db.query(RiskScore).filter(
            RiskScore.entity_type == "centre",
            RiskScore.risk_level.in_(["medium", "high", "critical"]),
        ).all()
        for rs in risk_scores:
            medium_plus_ids.add(rs.entity_id)
        centres = [c for c in centres if c.id in medium_plus_ids]

    if len(centres) <= count:
        selected = centres
    else:
        selected = random.sample(centres, count)

    return [
        {
            "centre_id": c.id,
            "centre_name": c.centre_name,
            "centre_code": c.centre_code,
            "district": c.district,
            "state": c.state,
            "selection_method": "random",
        }
        for c in selected
    ]


def get_beneficiary_sample(batch_id: int, sample_size: int, db: Session) -> list[str]:
    """Return random sample of beneficiary tokens from a batch."""
    from app.models.beneficiary import Beneficiary
    enrolments = db.query(BeneficiaryEnrolment).filter(
        BeneficiaryEnrolment.batch_id == batch_id
    ).all()
    ben_ids = [e.beneficiary_id for e in enrolments]

    if len(ben_ids) <= sample_size:
        sample_ids = ben_ids
    else:
        sample_ids = random.sample(ben_ids, sample_size)

    tokens = []
    for bid in sample_ids:
        ben = db.query(Beneficiary).filter(Beneficiary.id == bid).first()
        if ben:
            tokens.append(ben.beneficiary_token)
    return tokens
