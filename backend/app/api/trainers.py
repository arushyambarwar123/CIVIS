"""Trainers, Attendance, Evidence, Assessment, Placement, Payment routers."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.trainer import Trainer

router = APIRouter(tags=["Trainers"])

@router.get("/trainers")
def list_trainers(db: Session = Depends(get_db)):
    trainers = db.query(Trainer).all()
    return [{"id": t.id, "trainer_code": t.trainer_code, "name": t.name,
             "qualification": t.qualification, "centre_id": t.centre_id} for t in trainers]
