from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from app.database import Base

class RiskScore(Base):
    __tablename__ = "risk_scores"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String)
    entity_id = Column(Integer)
    score = Column(Float)
    risk_level = Column(String)
    calculated_at = Column(DateTime)
    reasons = Column(Text)
