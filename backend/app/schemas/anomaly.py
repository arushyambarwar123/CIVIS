from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AnomalyBase(BaseModel):
    entity_type: str
    entity_id: int
    anomaly_type: str
    severity: str
    description: str
    detected_at: datetime
    evidence: str
    status: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None

class Anomaly(AnomalyBase):
    id: int
    class Config:
        from_attributes = True
