from sqlalchemy import Column, Integer, String, Date, Time, Float, ForeignKey
from app.database import Base

class Trainer(Base):
    __tablename__ = "trainers"
    id = Column(Integer, primary_key=True, index=True)
    trainer_code = Column(String, unique=True, index=True)
    name = Column(String)
    qualification = Column(String)
    centre_id = Column(Integer, ForeignKey("training_centres.id"))

class TrainerAttendance(Base):
    __tablename__ = "trainer_attendances"
    id = Column(Integer, primary_key=True, index=True)
    trainer_id = Column(Integer, ForeignKey("trainers.id"))
    batch_id = Column(Integer, ForeignKey("training_batches.id"))
    date = Column(Date)
    check_in_time = Column(Time)
    check_out_time = Column(Time)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
