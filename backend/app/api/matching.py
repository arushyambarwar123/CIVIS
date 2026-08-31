"""Matching API router."""
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.anomaly import Anomaly
from app.models.beneficiary import Beneficiary
from app.services.beneficiary_matching import run_matching

router = APIRouter(tags=["Matching"])


@router.get("/matching")
def get_matching_results(db: Session = Depends(get_db)):
    match_types = ["beneficiary_match_high", "beneficiary_match_possible", "duplicate_enrolment_match"]
    anomalies = db.query(Anomaly).filter(
        Anomaly.anomaly_type.in_(match_types)
    ).order_by(Anomaly.detected_at.desc()).all()

    result = []
    for a in anomalies:
        ev = {}
        try:
            ev = json.loads(a.evidence) if a.evidence else {}
        except Exception:
            pass

        b1 = db.query(Beneficiary).filter(Beneficiary.id == a.entity_id).first()
        b2 = db.query(Beneficiary).filter(Beneficiary.id == a.related_entity_id).first() if a.related_entity_id else None

        result.append({
            "anomaly_id": a.id,
            "anomaly_type": a.anomaly_type,
            "severity": a.severity,
            "confidence_score": ev.get("confidence", 0),
            "match_level": ev.get("match_level", "possible"),
            "reasons": ev.get("reasons", []),
            "is_conflict": ev.get("conflict_description") is not None,
            "conflict_description": ev.get("conflict_description"),
            "beneficiary_a": {
                "id": b1.id, "token": b1.beneficiary_token,
                "name": b1.name, "age": b1.age,
                "district": b1.district, "mobile_token": b1.mobile_token,
                "bank_account_token": b1.bank_account_token,
            } if b1 else None,
            "beneficiary_b": {
                "id": b2.id, "token": b2.beneficiary_token,
                "name": b2.name, "age": b2.age,
                "district": b2.district, "mobile_token": b2.mobile_token,
                "bank_account_token": b2.bank_account_token,
            } if b2 else None,
            "detected_at": str(a.detected_at),
            "status": a.status,
        })
    return result


@router.post("/matching/run")
def run_beneficiary_matching(db: Session = Depends(get_db)):
    results = run_matching(db)
    conflicts = sum(1 for r in results if r.get("is_conflict"))
    return {
        "status": "success",
        "matches_found": len(results),
        "conflicts_found": conflicts,
        "anomalies_created": len(results),
        "message": f"Matching complete. Found {len(results)} matches ({conflicts} conflicts).",
    }
