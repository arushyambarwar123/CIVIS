from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InspectionBase(BaseModel):
    centre_id: int
    batch_id: Optional[int] = None
    inspector_name: str
    inspection_date: datetime
    actual_people_found: Optional[int] = None
    findings: str
    compliance_status: str
    status: str
    duration_minutes: Optional[int] = None
    inspector_latitude: Optional[float] = None
    inspector_longitude: Optional[float] = None
    checklist: str

class Inspection(InspectionBase):
    id: int
    class Config:
        from_attributes = True
