from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from app.database import Base

class Placement(Base):
    __tablename__ = "placements"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    employer_name = Column(String)
    employment_type = Column(String)
    placement_date = Column(Date)
    salary = Column(Float)
    verification_status = Column(String)
