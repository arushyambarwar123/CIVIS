from pydantic import BaseModel
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
