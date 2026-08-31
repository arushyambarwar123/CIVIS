"""Attendance router."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.attendance import Attendance

router = APIRouter(tags=["Attendance"])

@router.get("/attendance")
def list_attendance(batch_id: int = None, beneficiary_id: int = None, db: Session = Depends(get_db)):
    q = db.query(Attendance)
    if batch_id:
        q = q.filter(Attendance.batch_id == batch_id)
    if beneficiary_id:
        q = q.filter(Attendance.beneficiary_id == beneficiary_id)
    records = q.limit(500).all()
    return [{"id": a.id, "beneficiary_id": a.beneficiary_id, "batch_id": a.batch_id,
             "date": str(a.date), "check_in_time": str(a.check_in_time),
             "check_out_time": str(a.check_out_time),
             "attendance_status": a.attendance_status,
             "attendance_source": a.attendance_source,
             "latitude": a.latitude, "longitude": a.longitude} for a in records]
