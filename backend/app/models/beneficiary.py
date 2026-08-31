from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey
from app.database import Base

class Beneficiary(Base):
    __tablename__ = "beneficiaries"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_token = Column(String, unique=True, index=True)
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    category = Column(String)
    district = Column(String)
    state = Column(String)
    eligibility_status = Column(Boolean)
    bank_account_token = Column(String)
    mobile_token = Column(String)

class BeneficiaryEnrolment(Base):
    __tablename__ = "beneficiary_enrolments"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    enrolment_date = Column(Date)
    status = Column(String)
    completion_status = Column(String)
