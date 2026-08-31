import os

base_dir = r"C:\Users\arush\.gemini\antigravity\scratch\civis-lite\backend"

def write_file(path, content):
    with open(os.path.join(base_dir, path), "w", encoding="utf-8") as f:
        f.write(content)

write_file("app/schemas/__init__.py", "")

write_file("app/schemas/centre.py", '''from pydantic import BaseModel
from typing import Optional
from datetime import date

class CentreBase(BaseModel):
    centre_code: str
    centre_name: str
    organisation_name: str
    state: str
    district: str
    address: str
    latitude: float
    longitude: float
    status: str
    registration_date: date
    last_inspection_date: Optional[date] = None

class Centre(CentreBase):
    id: int
    class Config:
        orm_mode = True
        from_attributes = True
''')

write_file("app/schemas/batch.py", '''from pydantic import BaseModel
from typing import Optional
from datetime import date

class BatchBase(BaseModel):
    batch_code: str
    centre_id: int
    course_name: str
    trainer_id: Optional[int] = None
    start_date: date
    end_date: date
    expected_training_hours: int
    batch_capacity: int
    registered_count: int
    status: str

class Batch(BatchBase):
    id: int
    class Config:
        from_attributes = True
''')

write_file("app/schemas/beneficiary.py", '''from pydantic import BaseModel
from typing import Optional
from datetime import date

class BeneficiaryBase(BaseModel):
    beneficiary_token: str
    name: str
    age: int
    gender: str
    category: str
    district: str
    state: str
    eligibility_status: bool
    bank_account_token: str
    mobile_token: str

class Beneficiary(BeneficiaryBase):
    id: int
    class Config:
        from_attributes = True
''')

write_file("app/schemas/attendance.py", '''from pydantic import BaseModel
from typing import Optional
from datetime import date, time

class AttendanceBase(BaseModel):
    beneficiary_id: int
    batch_id: int
    date: date
    check_in_time: time
    check_out_time: time
    attendance_status: str
    attendance_source: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class Attendance(AttendanceBase):
    id: int
    class Config:
        from_attributes = True
''')

write_file("app/schemas/anomaly.py", '''from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AnomalyBase(BaseModel):
    entity_type: str
    entity_id: int
    anomaly_type: str
    severity: str
    description: str
    detected_at: datetime
    evidence: str
    status: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[int] = None

class Anomaly(AnomalyBase):
    id: int
    class Config:
        from_attributes = True
''')

write_file("app/schemas/risk.py", '''from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RiskScoreBase(BaseModel):
    entity_type: str
    entity_id: int
    score: float
    risk_level: str
    calculated_at: datetime
    reasons: str

class RiskScore(RiskScoreBase):
    id: int
    class Config:
        from_attributes = True
''')

write_file("app/schemas/inspection.py", '''from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class InspectionBase(BaseModel):
    centre_id: int
    batch_id: Optional[int] = None
    inspector_name: str
    inspection_date: datetime
    actual_people_found: Optional[int] = None
    findings: str
    compliance_status: str
    status: str
    duration_minutes: Optional[int] = None
    inspector_latitude: Optional[float] = None
    inspector_longitude: Optional[float] = None
    checklist: str

class Inspection(InspectionBase):
    id: int
    class Config:
        from_attributes = True
''')

print("Created core schemas.")
