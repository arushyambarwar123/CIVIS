"""Analysis engines trigger router — run individual or all analyzers."""
import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.attendance_analyzer import analyze_attendance
from app.services.evidence_analyzer import analyze_evidence
from app.services.placement_analyzer import analyze_placements
from app.services.payment_analyzer import analyze_payments
from app.services.beneficiary_matching import run_matching
from app.services.risk_engine import recalculate_all

router = APIRouter(tags=["Analysis"])


def load_cfg(name: str) -> dict:
    import os
    path = os.path.join(os.path.dirname(__file__), "..", "config", f"{name}.json")
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return {}


@router.post("/analyse/attendance")
def run_attendance(db: Session = Depends(get_db)):
    cfg = load_cfg("attendance_rules")
    result = analyze_attendance(db, cfg)
    return {"status": "success", "anomalies_detected": result}


@router.post("/analyse/evidence")
def run_evidence(db: Session = Depends(get_db)):
    cfg = load_cfg("evidence_rules")
    result = analyze_evidence(db, cfg)
    return {"status": "success", "anomalies_detected": result}


@router.post("/analyse/placements")
def run_placements(db: Session = Depends(get_db)):
    result = analyze_placements(db)
    return {"status": "success", "anomalies_detected": result}


@router.post("/analyse/payments")
def run_payments(db: Session = Depends(get_db)):
    cfg = load_cfg("attendance_rules")
    result = analyze_payments(db, cfg)
    return {"status": "success", "anomalies_detected": result}


@router.post("/analyse/matching")
def run_matching_endpoint(db: Session = Depends(get_db)):
    cfg = load_cfg("matching_rules")
    results = run_matching(db, cfg)
    conflicts = sum(1 for r in results if r.get("is_conflict"))
    return {"status": "success", "matches_found": len(results), "conflicts_found": conflicts}


@router.post("/analyse/all")
def run_all(db: Session = Depends(get_db)):
    att_cfg = load_cfg("attendance_rules")
    ev_cfg = load_cfg("evidence_rules")
    match_cfg = load_cfg("matching_rules")
    pay_cfg = load_cfg("attendance_rules")

    attendance = analyze_attendance(db, att_cfg)
    evidence = analyze_evidence(db, ev_cfg)
    placements = analyze_placements(db)
    payments = analyze_payments(db, pay_cfg)
    matching = run_matching(db, match_cfg)
    risk = recalculate_all(db)

    return {
        "status": "success",
        "message": "All analysis engines executed",
        "results": {
            "attendance": attendance,
            "evidence": evidence,
            "placements": placements,
            "payments": payments,
            "matching": {"matches_found": len(matching), "conflicts": sum(1 for m in matching if m.get("is_conflict"))},
            "risk": risk,
        },
    }
