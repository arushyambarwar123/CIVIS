from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    payment_type = Column(String)
    amount = Column(Float)
    payment_date = Column(Date)
    payment_status = Column(String)
    payment_reference = Column(String, nullable=True)
