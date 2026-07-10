from sqlalchemy import Column, Integer, String
from database import Base

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)

    doctor = Column(String)
    hospital = Column(String)
    specialization = Column(String)
    interactionType = Column(String)
    visitDate = Column(String)
    visitTime = Column(String)
    attendees = Column(String)
    product = Column(String)
    materials = Column(String)
    samples = Column(Integer)
    notes = Column(String)
    sentiment = Column(String)
    outcomes = Column(String)
    followUp = Column(String)
    summary = Column(String)