"""
CIVIS — Inspection assignment history for audit trail.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from app.database import Base
import datetime


class InspectionAssignmentHistory(Base):
    __tablename__ = "inspection_assignment_history"

    id = Column(Integer, primary_key=True, index=True)
    inspection_id = Column(Integer, ForeignKey("inspections.id"), nullable=False)
    previous_inspector_id = Column(String, nullable=True)   # employee_id of previous inspector
    new_inspector_id = Column(String, nullable=False)        # employee_id of new inspector
    assigned_by_employee_id = Column(String, nullable=False) # who made the assignment
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    reason = Column(Text, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String, nullable=False)            # LOGIN, ASSIGN, UPDATE, DELETE, etc.
    actor_employee_id = Column(String, nullable=False)
    actor_role = Column(String, nullable=False)
    target_entity_type = Column(String, nullable=True)      # User, Inspection, Anomaly, etc.
    target_entity_id = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    ip_address = Column(String, nullable=True)
