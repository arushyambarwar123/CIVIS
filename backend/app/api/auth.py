"""
CIVIS — Auth API router.
POST /api/v1/auth/login  — returns JWT
GET  /api/v1/auth/me     — returns current user profile
POST /api/v1/auth/logout — client-side (stateless JWT)
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import datetime

from app.database import get_db
from app.models.user import User, InspectorProfile, MonitoringOfficerProfile
from app.models.assignment_history import AuditLog
from app.services.auth_service import (
    verify_password, create_access_token, get_current_user
)

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    employee_id: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    employee_id: str
    name: str
    region: Optional[str]
    inspector_id: Optional[str] = None
    assigned_area: Optional[str] = None
    officer_id: Optional[str] = None


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.employee_id == payload.employee_id).first()

    # If users table is empty (e.g. fresh Vercel instance or reset database), auto-seed demo users
    if not user and db.query(User).count() == 0:
        from app.services.seed_service import ensure_all_demo_data
        ensure_all_demo_data(db)
        user = db.query(User).filter(User.employee_id == payload.employee_id).first()

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid employee ID or password",
        )

    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.status}. Contact your administrator.",
        )

    # Update last login timestamp
    user.last_login = datetime.datetime.utcnow()
    db.commit()

    # Audit log
    log = AuditLog(
        action_type="LOGIN",
        actor_employee_id=user.employee_id,
        actor_role=user.role,
        description=f"User {user.name} logged in",
        ip_address=request.client.host if request.client else None,
    )
    db.add(log)
    db.commit()

    token_data = {
        "sub": user.employee_id,
        "role": user.role,
        "region": user.region,
        "user_id": user.id,
        "name": user.name,
    }
    access_token = create_access_token(token_data)

    # Gather profile extras
    inspector_id = None
    assigned_area = None
    officer_id = None

    if user.role == "INSPECTOR" and user.inspector_profile:
        inspector_id = user.inspector_profile.inspector_id
        assigned_area = user.inspector_profile.assigned_area
    elif user.role == "MONITORING_OFFICER" and user.monitoring_profile:
        officer_id = user.monitoring_profile.officer_id

    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        employee_id=user.employee_id,
        name=user.name,
        region=user.region,
        inspector_id=inspector_id,
        assigned_area=assigned_area,
        officer_id=officer_id,
    )


@router.get("/me")
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile_extra = {}
    if current_user.role == "INSPECTOR":
        prof = db.query(InspectorProfile).filter(
            InspectorProfile.user_id == current_user.id
        ).first()
        if prof:
            profile_extra = {
                "inspector_id": prof.inspector_id,
                "assigned_area": prof.assigned_area,
                "designation": prof.designation,
                "phone": prof.phone,
            }
    elif current_user.role == "MONITORING_OFFICER":
        prof = db.query(MonitoringOfficerProfile).filter(
            MonitoringOfficerProfile.user_id == current_user.id
        ).first()
        if prof:
            import json
            profile_extra = {
                "officer_id": prof.officer_id,
                "jurisdiction_regions": json.loads(prof.jurisdiction_regions or "[]"),
            }

    return {
        "id": current_user.id,
        "employee_id": current_user.employee_id,
        "name": current_user.name,
        "role": current_user.role,
        "region": current_user.region,
        "status": current_user.status,
        "last_login": current_user.last_login.isoformat() if current_user.last_login else None,
        **profile_extra,
    }


@router.post("/logout")
def logout():
    # JWT is stateless — client deletes token
    return {"message": "Logged out. Please clear your session token."}


@router.post("/seed-users")
def seed_users_endpoint(db: Session = Depends(get_db)):
    from app.services.seed_service import ensure_all_demo_data
    ensure_all_demo_data(db)
    count = db.query(User).count()
    return {"status": "success", "user_count": count}
