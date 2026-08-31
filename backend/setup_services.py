import os

base_dir = r"C:\Users\arush\.gemini\antigravity\scratch\civis-lite\backend"

def write_file(path, content):
    with open(os.path.join(base_dir, path), "w", encoding="utf-8") as f:
        f.write(content)

write_file("app/services/__init__.py", "")

write_file("app/services/geo_validator.py", '''import math

def haversine_distance(lat1, lon1, lat2, lon2) -> float:
    R = 6371000
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return distance

def is_within_radius(centre_lat, centre_lon, point_lat, point_lon, radius_metres) -> bool:
    if None in [centre_lat, centre_lon, point_lat, point_lon]:
        return False
    return haversine_distance(centre_lat, centre_lon, point_lat, point_lon) <= radius_metres
''')

write_file("app/services/attendance_analyzer.py", '''from sqlalchemy.orm import Session
def analyze_attendance(db: Session, config: dict) -> list[dict]:
    return []
''')

write_file("app/services/risk_engine.py", '''from sqlalchemy.orm import Session
from app.models.risk import RiskScore

def calculate_risk_for_entity(entity_type: str, entity_id: int, db: Session, config: dict):
    return RiskScore(entity_type=entity_type, entity_id=entity_id, score=0, risk_level="low", reasons="[]")
''')

print("Created services.")
