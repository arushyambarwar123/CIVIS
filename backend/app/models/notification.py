"""
CIVIS — In-app notifications model.
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from app.database import Base
import datetime


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_employee_id = Column(String, nullable=False, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String, default="info")  # info | warning | critical | success
    related_entity_type = Column(String, nullable=True)
    related_entity_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
