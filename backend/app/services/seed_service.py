"""
CIVIS — Reliable Seeding Service.
Contains embedded logic for seeding demo users, inspector assignments, and baseline data.
Can be imported safely anywhere in the application.
"""
import datetime
import random
from sqlalchemy.orm import Session

from app.models.user import User, InspectorProfile, MonitoringOfficerProfile
from app.models.inspection import Inspection
from app.models.centre import TrainingCentre
from app.models.notification import Notification
from app.services.auth_service import hash_password

DEMO_USERS = [
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


def seed_demo_users(db: Session) -> int:
    """Seed demo user accounts if they don't already exist. Returns count of created users."""
    created = 0
    for u in DEMO_USERS:
        existing = db.query(User).filter(User.employee_id == u["employee_id"]).first()
        if existing:
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

    db.commit()
    return created


def seed_demo_inspector_assignments(db: Session) -> int:
    """Assign inspections and notifications to inspectors if not already present."""
    existing = db.query(Inspection).filter(
        Inspection.inspector_name.like("INS-%")
    ).count()
    if existing > 0:
        return 0

    centres = db.query(TrainingCentre).all()
    if not centres:
        return 0

    inspectors = [
        {"id": "INS-PUN-001", "name": "Aarav Sharma"},
        {"id": "INS-PUN-002", "name": "Neha Patil"},
        {"id": "INS-PUN-003", "name": "Rohan Deshmukh"},
        {"id": "INS-PUN-004", "name": "Sneha Kulkarni"},
        {"id": "INS-PUN-005", "name": "Aditya Joshi"},
    ]

    now = datetime.datetime.utcnow()
    inspection_records = []

    for idx, insp in enumerate(inspectors):
        # Scheduled
        inspection_records.append(Inspection(
            centre_id=centres[idx % len(centres)].id,
            batch_id=None,
            inspector_name=insp["id"],
            inspection_date=now + datetime.timedelta(days=random.randint(3, 14)),
            actual_people_found=None,
            findings=None,
            compliance_status="pending",
            status="scheduled",
            duration_minutes=None,
            checklist=None,
        ))

        # In-progress
        if idx < 3:
            inspection_records.append(Inspection(
                centre_id=centres[(idx + 2) % len(centres)].id,
                batch_id=None,
                inspector_name=insp["id"],
                inspection_date=now - datetime.timedelta(days=random.randint(0, 2)),
                actual_people_found=None,
                findings=None,
                compliance_status="pending",
                status="in_progress",
                duration_minutes=None,
                checklist=None,
            ))

        # Completed
        for j in range(random.randint(1, 2)):
            inspection_records.append(Inspection(
                centre_id=centres[(idx + j + 5) % len(centres)].id,
                batch_id=None,
                inspector_name=insp["id"],
                inspection_date=now - datetime.timedelta(days=random.randint(15, 60)),
                actual_people_found=random.randint(20, 45),
                findings='{"summary": "Routine inspection completed."}',
                compliance_status=random.choice(["compliant", "partially_compliant"]),
                status="submitted",
                duration_minutes=random.randint(45, 120),
                checklist='{"infrastructure": true, "attendance_register": true, "trainer_present": true}',
            ))

    db.add_all(inspection_records)

    notifications = []
    for insp in inspectors[:3]:
        notifications.append(Notification(
            recipient_employee_id=insp["id"],
            title="New Inspection Assigned",
            message="You have been assigned a new inspection. Please review your schedule.",
            notification_type="info",
            related_entity_type="Inspection",
            is_read=False,
            created_at=now - datetime.timedelta(hours=random.randint(1, 48)),
        ))
    db.add_all(notifications)
    db.commit()
    return len(inspection_records)


def ensure_all_demo_data(db: Session):
    """Ensures training centres/batches, users, and assignments are all seeded."""
    # 1. Base scheme data
    try:
        from app.models.centre import TrainingCentre
        if db.query(TrainingCentre).count() == 0:
            import seed_data
            seed_data.seed_db()
    except Exception as e:
        print(f"[CIVIS] Base seed error: {e}")

    # 2. Users
    try:
        seed_demo_users(db)
    except Exception as e:
        print(f"[CIVIS] User seed error: {e}")

    # 3. Assignments
    try:
        seed_demo_inspector_assignments(db)
    except Exception as e:
        print(f"[CIVIS] Inspector assignments error: {e}")
