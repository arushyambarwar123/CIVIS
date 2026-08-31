"""Dashboard summary endpoint."""
import json
from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.centre import TrainingCentre
from app.models.batch import TrainingBatch
from app.models.beneficiary import Beneficiary
from app.models.anomaly import Anomaly
from app.models.risk import RiskScore
from app.models.inspection import Inspection
from app.models.corrective_action import CorrectiveAction
from app.services.inspection_prioritizer import get_priority_list

router = APIRouter(tags=["Dashboard"])


@router.get("/dashboard/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    total_centres = db.query(TrainingCentre).count()
    active_batches = db.query(TrainingBatch).filter(TrainingBatch.status == "active").count()
    total_beneficiaries = db.query(Beneficiary).count()

    risk_scores = db.query(RiskScore).filter(RiskScore.entity_type == "centre").all()
    dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for rs in risk_scores:
        dist[rs.risk_level] = dist.get(rs.risk_level, 0) + 1

    high_risk = dist["high"] + dist["critical"]
    critical_risk = dist["critical"]

    open_anomalies = db.query(Anomaly).filter(Anomaly.status == "open").count()
    pending_inspections = db.query(Inspection).filter(
        Inspection.status.in_(["scheduled", "in_progress"])
    ).count()
    overdue_actions = db.query(CorrectiveAction).filter(
        CorrectiveAction.status == "overdue"
    ).count()

    recent_anomalies = db.query(Anomaly).filter(
        Anomaly.status == "open"
    ).order_by(Anomaly.detected_at.desc()).limit(10).all()

    recent_list = []
    for a in recent_anomalies:
        ev = {}
        try:
            ev = json.loads(a.evidence) if a.evidence else {}
        except Exception:
            pass
        recent_list.append({
            "id": a.id,
            "entity_type": a.entity_type,
            "entity_id": a.entity_id,
            "anomaly_type": a.anomaly_type,
            "severity": a.severity,
            "description": a.description,
            "detected_at": str(a.detected_at),
            "status": a.status,
        })

    try:
        top_priorities = get_priority_list(db)[:5]
    except Exception:
        top_priorities = []

    return {
        "total_centres": total_centres,
        "active_batches": active_batches,
        "total_beneficiaries": total_beneficiaries,
        "high_risk_centres": high_risk,
        "critical_risk_centres": critical_risk,
        "open_anomalies": open_anomalies,
        "pending_inspections": pending_inspections,
        "overdue_actions": overdue_actions,
        "risk_distribution": dist,
        "recent_anomalies": recent_list,
        "top_priorities": top_priorities,
    }
