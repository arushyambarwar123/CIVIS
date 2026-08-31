from sqlalchemy import Column, Integer, String, Date, Boolean, DateTime, ForeignKey
from app.database import Base

class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"
    id = Column(Integer, primary_key=True, index=True)
    anomaly_id = Column(Integer, ForeignKey("anomalies.id"), nullable=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=True)
    centre_id = Column(Integer, ForeignKey("training_centres.id"))
    responsible_person = Column(String)
    action_required = Column(String)
    deadline = Column(Date)
    severity = Column(String)
    status = Column(String)
    evidence_submitted = Column(String, nullable=True)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime)
