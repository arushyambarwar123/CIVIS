"""Assessments router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.assessment import Assessment

router = APIRouter(tags=["Assessments"])

@router.get("/assessments")
def list_assessments(batch_id: int = None, beneficiary_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Assessment)
    if batch_id:
        q = q.filter(Assessment.batch_id == batch_id)
    if beneficiary_id:
        q = q.filter(Assessment.beneficiary_id == beneficiary_id)
    records = q.all()
    return [{"id": a.id, "beneficiary_id": a.beneficiary_id, "batch_id": a.batch_id,
             "score": a.score, "result": a.result, "assessment_date": str(a.assessment_date),
             "certification_status": a.certification_status} for a in records]
