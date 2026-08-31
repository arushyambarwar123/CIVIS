from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from app.database import Base

class Inspection(Base):
    __tablename__ = "inspections"
    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("training_centres.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"), nullable=True)
    inspector_name = Column(String)
    inspection_date = Column(DateTime)
    actual_people_found = Column(Integer, nullable=True)
    findings = Column(Text)
    compliance_status = Column(String)
    status = Column(String)
    duration_minutes = Column(Integer, nullable=True)
    inspector_latitude = Column(Float, nullable=True)
    inspector_longitude = Column(Float, nullable=True)
    checklist = Column(Text)
