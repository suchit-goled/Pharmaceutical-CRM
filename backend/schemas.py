from pydantic import BaseModel

class InteractionBase(BaseModel):
    doctor: str
    hospital: str
    specialization: str

    interactionType: str

    visitDate: str
    visitTime: str

    attendees: str

    product: str

    materials: str

    samples: int

    notes: str

    sentiment: str

    outcomes: str

    followUp: str

    summary: str


class InteractionCreate(InteractionBase):
    pass


class InteractionResponse(InteractionBase):
    id: int

    class Config:
        from_attributes = True