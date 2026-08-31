from pydantic import BaseModel
from typing import Optional
from datetime import date, time

class AttendanceBase(BaseModel):
    beneficiary_id: int
    batch_id: int
    date: date
    check_in_time: time
    check_out_time: time
    attendance_status: str
    attendance_source: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Attendance(AttendanceBase):
    id: int
    class Config:
        from_attributes = True
