from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from app.database import Base

class Assessment(Base):
    __tablename__ = "assessments"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    score = Column(Float)
    result = Column(String)
    assessment_date = Column(Date)
    certification_status = Column(String)
