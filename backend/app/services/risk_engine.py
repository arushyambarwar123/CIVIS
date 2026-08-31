"""
Risk Engine — calculates explainable risk scores for centres, batches, and beneficiaries.
Reads weights and thresholds from config/risk_rules.json (never hardcoded).
"""
import json
import os
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.anomaly import Anomaly
from app.models.risk import RiskScore
from app.models.batch import TrainingBatch
from app.models.inspection import Inspection
from app.models.centre import TrainingCentre

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "config", "risk_rules.json")


def load_config() -> dict:
    with open(CONFIG_PATH) as f:
        return json.load(f)


def _risk_level(score: float, thresholds: dict) -> str:
    if score <= thresholds["low_max"]:
        return "low"
    elif score <= thresholds["medium_max"]:
        return "medium"
    elif score <= thresholds["high_max"]:
        return "high"
    else:
        return "critical"


def calculate_entity_risk(
    entity_type: str,
    entity_id: int,
    db: Session,
    extra_anomalies: Optional[list] = None,
) -> dict:
    """
    Calculate risk score for any entity type.
    Returns a dict with score, risk_level, and reasons list.
    """
    cfg = load_config()
    weights = cfg.get("weights", {})
    thresholds = cfg.get("thresholds", {})

    # Load anomalies for this entity
    anomalies = (
        db.query(Anomaly)
        .filter(Anomaly.entity_type == entity_type, Anomaly.entity_id == entity_id)
        .all()
    )
    if extra_anomalies:
        anomalies = list(anomalies) + extra_anomalies

    score = 0.0
    reasons = []
    used_types = set()

    # Severity multipliers
    severity_multipliers = {"critical": 1.5, "high": 1.0, "medium": 0.7, "low": 0.4}

    for anomaly in anomalies:
        atype = anomaly.anomaly_type
        base_weight = weights.get(atype, 5)
        multiplier = severity_multipliers.get(anomaly.severity, 0.5)
        contribution = round(base_weight * multiplier, 1)

        if atype not in used_types:
            score += contribution
            reasons.append(
                {
                    "factor": atype,
                    "contribution": contribution,
                    "description": anomaly.description,
                }
            )
            used_types.add(atype)
        else:
            # Additional anomaly of same type adds diminishing contribution
            score += contribution * 0.3

    # Add inspection overdue check for centres
    if entity_type == "centre":
        centre = db.query(TrainingCentre).filter(TrainingCentre.id == entity_id).first()
        if centre and centre.last_inspection_date:
            days_since = (datetime.now().date() - centre.last_inspection_date).days
            if days_since > 365 and "inspection_overdue" not in used_types:
                overdue_contribution = min(15, weights.get("inspection_overdue", 10))
                score += overdue_contribution
                reasons.append(
                    {
                        "factor": "inspection_overdue",
                        "contribution": overdue_contribution,
                        "description": f"Last inspection {days_since} days ago (overdue by {days_since - 365} days)",
                    }
                )

    score = min(100.0, round(score, 1))
    level = _risk_level(score, thresholds)

    return {"score": score, "risk_level": level, "reasons": reasons}


def upsert_risk_score(entity_type: str, entity_id: int, score: float, level: str, reasons: list, db: Session):
    existing = (
        db.query(RiskScore)
        .filter(RiskScore.entity_type == entity_type, RiskScore.entity_id == entity_id)
        .first()
    )
    if existing:
        existing.score = score
        existing.risk_level = level
        existing.calculated_at = datetime.now()
        existing.reasons = json.dumps(reasons)
    else:
        rs = RiskScore(
            entity_type=entity_type,
            entity_id=entity_id,
            score=score,
            risk_level=level,
            calculated_at=datetime.now(),
            reasons=json.dumps(reasons),
        )
        db.add(rs)
    db.commit()


def calculate_batch_risk(batch_id: int, db: Session) -> dict:
    result = calculate_entity_risk("batch", batch_id, db)
    upsert_risk_score("batch", batch_id, result["score"], result["risk_level"], result["reasons"], db)
    return result


def calculate_centre_risk(centre_id: int, db: Session) -> dict:
    cfg = load_config()
    agg = cfg.get("aggregation", {"centre_max_batch_weight": 0.6, "centre_avg_batch_weight": 0.4})

    # Get all batches for centre
    batches = db.query(TrainingBatch).filter(TrainingBatch.centre_id == centre_id).all()
    batch_scores = []
    for batch in batches:
        r = db.query(RiskScore).filter(
            RiskScore.entity_type == "batch", RiskScore.entity_id == batch.id
        ).first()
        if r:
            batch_scores.append(r.score)

    # Calculate centre-level risk from anomalies
    centre_result = calculate_entity_risk("centre", centre_id, db)

    if batch_scores:
        max_batch = max(batch_scores)
        avg_batch = sum(batch_scores) / len(batch_scores)
        batch_contribution = (
            max_batch * agg["centre_max_batch_weight"]
            + avg_batch * agg["centre_avg_batch_weight"]
        )
        # Blend centre anomaly score with batch contribution
        final_score = min(100.0, round(centre_result["score"] * 0.4 + batch_contribution * 0.6, 1))
    else:
        final_score = centre_result["score"]

    thresholds = cfg.get("thresholds", {})
    level = _risk_level(final_score, thresholds)
    upsert_risk_score("centre", centre_id, final_score, level, centre_result["reasons"], db)
    return {"score": final_score, "risk_level": level, "reasons": centre_result["reasons"]}


def recalculate_all(db: Session) -> dict:
    """Recalculate risk for all batches and centres."""
    from app.models.centre import TrainingCentre

    centres = db.query(TrainingCentre).all()
    batches = db.query(TrainingBatch).all()

    for batch in batches:
        calculate_batch_risk(batch.id, db)

    results = {}
    for centre in centres:
        r = calculate_centre_risk(centre.id, db)
        results[centre.id] = r

    return {"centres_updated": len(centres), "batches_updated": len(batches)}
