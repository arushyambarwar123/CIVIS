"""Priority list and random sampling router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.inspection import Inspection
from app.models.centre import TrainingCentre
from app.services.inspection_prioritizer import get_priority_list, generate_random_sample
from datetime import datetime

router = APIRouter(tags=["Priority"])


@router.get("/priority")
def priority_list(db: Session = Depends(get_db)):
    return get_priority_list(db)


@router.post("/priority/assign")
def assign_inspection(data: dict, db: Session = Depends(get_db)):
    centre_id = data.get("centre_id")
    inspector_name = data.get("inspector_name", "Assigned Inspector")
    batch_id = data.get("batch_id")

    i = Inspection(
        centre_id=centre_id,
        batch_id=batch_id,
        inspector_name=inspector_name,
        inspection_date=datetime.now(),
        findings="{}",
        compliance_status="pending",
        status="scheduled",
        checklist="{}",
    )
    db.add(i)
    db.commit()
    db.refresh(i)
    return {"status": "success", "inspection_id": i.id, "message": f"Inspection assigned to {inspector_name}"}


@router.get("/priority/random-sample")
def random_inspection_sample(
    count: int = 3,
    from_medium_plus: bool = False,
    db: Session = Depends(get_db)
):
    sample = generate_random_sample(db, count=count, from_medium_plus=from_medium_plus)
    return {"count": len(sample), "sample": sample}
