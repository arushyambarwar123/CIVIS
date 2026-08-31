from pydantic import BaseModel
from typing import Optional
from datetime import date

class CentreBase(BaseModel):
    centre_code: str
    centre_name: str
    organisation_name: str
    state: str
    district: str
    address: str
    latitude: float
    longitude: float
    status: str
    registration_date: date
    last_inspection_date: Optional[date] = None

class Centre(CentreBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True
