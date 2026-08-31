from sqlalchemy import Column, Integer, String, Date, Time, Float, ForeignKey
from app.database import Base

class Attendance(Base):
    __tablename__ = "attendances"
    id = Column(Integer, primary_key=True, index=True)
    beneficiary_id = Column(Integer, ForeignKey("beneficiaries.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    date = Column(Date)
    check_in_time = Column(Time)
    check_out_time = Column(Time)
    attendance_status = Column(String)
    attendance_source = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
