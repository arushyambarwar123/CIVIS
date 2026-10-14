"""
CIVIS — User, InspectorProfile, MonitoringOfficerProfile models.
Used by the RBAC authentication system.
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)          # INSPECTOR | MONITORING_OFFICER | CENTRAL
    region = Column(String, nullable=True)          # e.g. Pune, Mumbai
    status = Column(String, default="ACTIVE")       # ACTIVE | INACTIVE | SUSPENDED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    inspector_profile = relationship(
        "InspectorProfile", back_populates="user", uselist=False
    )
    monitoring_profile = relationship(
        "MonitoringOfficerProfile", back_populates="user", uselist=False
    )


class InspectorProfile(Base):
    __tablename__ = "inspector_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    inspector_id = Column(String, unique=True, index=True, nullable=False)  # INS-PUN-001
    assigned_area = Column(String, nullable=True)
    designation = Column(String, default="Field Inspector")
    phone = Column(String, nullable=True)

    user = relationship("User", back_populates="inspector_profile")


class MonitoringOfficerProfile(Base):
    __tablename__ = "monitoring_officer_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    officer_id = Column(String, unique=True, index=True, nullable=False)    # MO-PUN-001
    jurisdiction_regions = Column(Text, default="[]")                       # JSON list of regions

    user = relationship("User", back_populates="monitoring_profile")
