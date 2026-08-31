"""Placements router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.placement import Placement

router = APIRouter(tags=["Placements"])

@router.get("/placements")
def list_placements(batch_id: int = None, centre_id: int = None,
                    verification_status: str = None, db: Session = Depends(get_db)):
    q = db.query(Placement)
    if batch_id:
        q = q.filter(Placement.batch_id == batch_id)
    if verification_status:
        q = q.filter(Placement.verification_status == verification_status)
    if centre_id:
        from app.models.batch import TrainingBatch
        batch_ids = [b.id for b in db.query(TrainingBatch).filter(
            TrainingBatch.centre_id == centre_id).all()]
        q = q.filter(Placement.batch_id.in_(batch_ids))
    records = q.all()
    return [{"id": p.id, "beneficiary_id": p.beneficiary_id, "batch_id": p.batch_id,
             "employer_name": p.employer_name, "employment_type": p.employment_type,
             "placement_date": str(p.placement_date), "salary": p.salary,
             "verification_status": p.verification_status} for p in records]
