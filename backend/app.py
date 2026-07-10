from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel

from ai_graph.graph import graph
from ai_graph.nodes import pharma_ai_assistant
from database import Base, engine
from database import SessionLocal

from typing import Any

import models

from schemas import InteractionCreate

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

class Prompt(BaseModel):
    prompt:str




class AssistantRequest(BaseModel):
    message: str
    interaction: dict
    history: list


@app.post("/save")
def save_interaction(interaction: InteractionCreate):

    db = SessionLocal()

    record = models.Interaction(
        **interaction.model_dump()
    )

    db.add(record)

    db.commit()

    db.refresh(record)

    db.close()

    return {
        "message": "Interaction Saved Successfully",
        "id": record.id
    }

@app.get("/interactions")
def get_interactions():

    db = SessionLocal()

    data = db.query(models.Interaction).all()

    db.close()

    return data

@app.get("/interaction/{id}")
def get_interaction(id: int):

    db = SessionLocal()

    interaction = db.query(models.Interaction).filter(
        models.Interaction.id == id
    ).first()

    db.close()

    return interaction

@app.put("/interaction/{id}")
def update_interaction(
    id: int,
    interaction: InteractionCreate
):

    db = SessionLocal()

    record = db.query(models.Interaction).filter(
        models.Interaction.id == id
    ).first()

    if not record:
        db.close()
        return {"message": "Not Found"}

    for key, value in interaction.model_dump().items():
        setattr(record, key, value)

    db.commit()

    db.refresh(record)

    db.close()

    return {
        "message": "Updated Successfully"
    }

@app.delete("/interaction/{id}")
def delete_interaction(id: int):

    db = SessionLocal()

    record = db.query(models.Interaction).filter(
        models.Interaction.id == id
    ).first()

    if not record:
        db.close()
        return {"message": "Not Found"}

    db.delete(record)

    db.commit()

    db.close()

    return {
        "message": "Deleted Successfully"
    }

@app.post("/generate")
def generate(data: Prompt):

    result = graph.invoke({

        "prompt": data.prompt

    })

    return result["response"]



from fastapi import HTTPException

@app.post("/assistant")
def assistant(data: AssistantRequest):

    try:

        print("MESSAGE:", data.message)
        print("INTERACTION:", data.interaction)

        result = pharma_ai_assistant({

    "interaction": data.interaction,

    "assistant_message": data.message,

    "history": data.history

})

        print(result)

        return result["assistant"]

    except Exception as e:

        import traceback

        traceback.print_exc()

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )