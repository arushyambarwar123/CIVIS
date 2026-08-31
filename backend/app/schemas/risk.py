from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RiskScoreBase(BaseModel):
    entity_type: str
    entity_id: int
    score: float
    risk_level: str
    calculated_at: datetime
    reasons: str

class RiskScore(RiskScoreBase):
    id: int
    class Config:
        from_attributes = True
