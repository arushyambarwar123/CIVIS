"""Risk Analysis API router."""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.risk import RiskScore
from app.models.centre import TrainingCentre
from app.models.batch import TrainingBatch
from app.services.risk_engine import recalculate_all, calculate_centre_risk, calculate_batch_risk

router = APIRouter(tags=["Risk"])


def format_risk(rs: RiskScore) -> dict:
    reasons = []
    try:
        reasons = json.loads(rs.reasons) if rs.reasons else []
    except Exception:
        pass
    return {
        "id": rs.id,
        "entity_type": rs.entity_type,
        "entity_id": rs.entity_id,
        "score": rs.score,
        "risk_level": rs.risk_level,
        "calculated_at": str(rs.calculated_at),
        "reasons": reasons,
    }


@router.get("/risk")
def list_risk_scores(entity_type: str = None, db: Session = Depends(get_db)):
    q = db.query(RiskScore)
    if entity_type:
        q = q.filter(RiskScore.entity_type == entity_type)
    scores = q.all()

    result = []
    for rs in scores:
        item = format_risk(rs)
        # Attach entity name
        if rs.entity_type == "centre":
            c = db.query(TrainingCentre).filter(TrainingCentre.id == rs.entity_id).first()
            item["entity_name"] = c.centre_name if c else f"Centre {rs.entity_id}"
            item["entity_code"] = c.centre_code if c else ""
        elif rs.entity_type == "batch":
            b = db.query(TrainingBatch).filter(TrainingBatch.id == rs.entity_id).first()
            item["entity_name"] = b.batch_code if b else f"Batch {rs.entity_id}"
            item["entity_code"] = b.batch_code if b else ""
        result.append(item)

    result.sort(key=lambda x: x["score"], reverse=True)
    return result


@router.get("/risk/{entity_type}/{entity_id}")
def get_risk_score(entity_type: str, entity_id: int, db: Session = Depends(get_db)):
    rs = db.query(RiskScore).filter(
        RiskScore.entity_type == entity_type,
        RiskScore.entity_id == entity_id,
    ).first()
    if not rs:
        raise HTTPException(status_code=404, detail="Risk score not found")
    return format_risk(rs)


@router.post("/risk/recalculate")
def recalculate_risk_all(db: Session = Depends(get_db)):
    result = recalculate_all(db)
    return {"status": "success", "message": "Risk scores recalculated", **result}


@router.post("/risk/recalculate/{entity_type}/{entity_id}")
def recalculate_risk_one(entity_type: str, entity_id: int, db: Session = Depends(get_db)):
    if entity_type == "centre":
        r = calculate_centre_risk(entity_id, db)
    elif entity_type == "batch":
        r = calculate_batch_risk(entity_id, db)
    else:
        raise HTTPException(status_code=400, detail="entity_type must be 'centre' or 'batch'")
    return {"status": "success", "result": r}
