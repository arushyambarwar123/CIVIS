"""
CIVIS — Seed demo user accounts with bcrypt-hashed passwords.
Run: python seed_users.py
Idempotent — safe to call multiple times.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import User, InspectorProfile, MonitoringOfficerProfile
from app.services.auth_service import hash_password
import datetime

Base.metadata.create_all(bind=engine)

USERS = [
    {
        "employee_id": "CA-001",
        "name": "Central Authority",
        "password": "Civis@Central001",
        "role": "CENTRAL_ADMIN",
        "region": None,
    },
    {
        "employee_id": "MO-PUN-001",
        "name": "Priya Mehta",
        "password": "Civis@MO001",
        "role": "MONITORING_OFFICER",
        "region": "Pune",
        "officer_id": "MO-PUN-001",
        "jurisdiction_regions": '["Pune", "Nashik"]',
    },
    {
        "employee_id": "INS-PUN-001",
        "name": "Aarav Sharma",
        "password": "Civis@Ins001",
        "role": "INSPECTOR",
        "region": "Pune",
        "inspector_id": "INS-PUN-001",
        "assigned_area": "Pimpri",
        "designation": "Field Inspector",
    },
    {
        "employee_id": "INS-PUN-002",
        "name": "Neha Patil",
        "password": "Civis@Ins002",
        "role": "INSPECTOR",
        "region": "Pune",
        "inspector_id": "INS-PUN-002",
        "assigned_area": "Chinchwad",
        "designation": "Field Inspector",
    },
    {
        "employee_id": "INS-PUN-003",
        "name": "Rohan Deshmukh",
        "password": "Civis@Ins003",
        "role": "INSPECTOR",
        "region": "Pune",
        "inspector_id": "INS-PUN-003",
        "assigned_area": "Wakad",
        "designation": "Senior Inspector",
    },
    {
        "employee_id": "INS-PUN-004",
        "name": "Sneha Kulkarni",
        "password": "Civis@Ins004",
        "role": "INSPECTOR",
        "region": "Pune",
        "inspector_id": "INS-PUN-004",
        "assigned_area": "Hinjawadi",
        "designation": "Field Inspector",
    },
    {
        "employee_id": "INS-PUN-005",
        "name": "Aditya Joshi",
        "password": "Civis@Ins005",
        "role": "INSPECTOR",
        "region": "Pune",
        "inspector_id": "INS-PUN-005",
        "assigned_area": "Tathawade",
        "designation": "Field Inspector",
    },
]


def seed_users():
    db = SessionLocal()
    try:
        created = 0
        skipped = 0
        for u in USERS:
            existing = db.query(User).filter(User.employee_id == u["employee_id"]).first()
            if existing:
                skipped += 1
                print(f"  [SKIP]   {u['employee_id']} already exists")
                continue

            user = User(
                employee_id=u["employee_id"],
                name=u["name"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                region=u.get("region"),
                status="ACTIVE",
                created_at=datetime.datetime.utcnow(),
            )
            db.add(user)
            db.flush()

            if u["role"] == "INSPECTOR":
                profile = InspectorProfile(
                    user_id=user.id,
                    inspector_id=u["inspector_id"],
                    assigned_area=u.get("assigned_area"),
                    designation=u.get("designation", "Field Inspector"),
                )
                db.add(profile)

            elif u["role"] == "MONITORING_OFFICER":
                profile = MonitoringOfficerProfile(
                    user_id=user.id,
                    officer_id=u["officer_id"],
                    jurisdiction_regions=u.get("jurisdiction_regions", "[]"),
                )
                db.add(profile)

            created += 1
            print(f"  [CREATE] {u['employee_id']} ({u['role']}) - {u['name']}")

        db.commit()
        print(f"\nDone. Created: {created}, Skipped: {skipped}")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding CIVIS demo user accounts...")
    seed_users()
