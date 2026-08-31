from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base

class Anomaly(Base):
    __tablename__ = "anomalies"
    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String)
    entity_id = Column(Integer)
    anomaly_type = Column(String)
    severity = Column(String)
    description = Column(String)
    detected_at = Column(DateTime)
    evidence = Column(Text)
    status = Column(String)
    related_entity_type = Column(String, nullable=True)
    related_entity_id = Column(Integer, nullable=True)
