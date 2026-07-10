import os
import json

from groq import Groq
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise Exception("GROQ_API_KEY not found in .env")

print("API KEY:", api_key)

client = Groq(api_key=api_key)

SYSTEM_PROMPT = """
You are an AI Medical CRM Assistant.

Extract the following information and return ONLY valid JSON.

{
    "doctor":"",
    "hospital":"",
    "specialization":"",
    "interactionType":"",
    "visitDate":"",
    "visitTime":"",
    "attendees":"",
    "product":"",
    "materials":"",
    "samples":0,
    "notes":"",
    "sentiment":"Positive",
    "outcomes":"",
    "followUp":"",
    "summary":""
}
"""


def generate_report(prompt: str):

    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    text = completion.choices[0].message.content.strip()

    print("\n========== LLM RESPONSE ==========")
    print(text)
    print("==================================\n")

    if text.startswith("```"):
        text = (
            text.replace("```json", "")
                .replace("```", "")
                .strip()
        )

    return json.loads(text)