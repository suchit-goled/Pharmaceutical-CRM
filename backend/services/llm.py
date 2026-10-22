import logging
from .ai_service import get_groq_client, clean_json_output, fallback_extract, AI_DISCLAIMER
from config import settings

logger = logging.getLogger("llm_service")

SYSTEM_PROMPT = """
You are an AI Medical CRM Assistant.
Extract the following information and return ONLY valid JSON.
Never include explanations or markdown fences.
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

def generate_report(prompt: str) -> dict:
    client = get_groq_client()
    if not client:
        logger.info("Using fallback extraction (Groq client not configured)")
        return fallback_extract(prompt)

    try:
        completion = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            temperature=0.2,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ]
        )
        text = completion.choices[0].message.content.strip()
        data = clean_json_output(text)
        data["disclaimer"] = AI_DISCLAIMER
        return data
    except Exception as e:
        logger.warning("Groq API error during report generation: %s. Falling back.", e)
        return fallback_extract(prompt)
