import os
import re
import json
import logging
from typing import Dict, Any, Optional
from datetime import date
from config import settings

logger = logging.getLogger("ai_service")

# Medical CRM Disclaimer
AI_DISCLAIMER = (
    "Advisory Only: AI-generated intelligence is advisory and must be verified by licensed "
    "pharmaceutical representatives and medical directors before clinical, commercial, or regulatory decisions."
)

def get_groq_client():
    """
    Safely retrieves a Groq client instance if the API key is present.
    Returns None if the key is missing or invalid.
    """
    key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
    if not key or not key.strip() or key.startswith("your_"):
        return None
    try:
        from groq import Groq
        return Groq(api_key=key.strip(), timeout=settings.AI_TIMEOUT_SECONDS)
    except Exception as e:
        logger.warning("Could not initialize Groq client: %s", e)
        return None

def clean_json_output(text: str) -> dict:
    """
    Robust JSON parser for LLM responses handling markdown codeblocks and leading/trailing chatter.
    """
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        text = text.strip()
    
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)

def fallback_extract(prompt: str) -> Dict[str, Any]:
    """
    Deterministic rule-based pharmaceutical interaction extractor used when
    the external LLM provider is offline, unreachable, or unconfigured.
    Guarantees 100% uptime and predictability under enterprise load.
    """
    today = date.today().isoformat()
    lines = prompt.split("\n")
    
    # 1. Doctor extraction
    doctor = ""
    doc_match = re.search(r"(?:Dr\.|Doctor)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)", prompt, re.IGNORECASE)
    if doc_match:
        doctor = f"Dr. {doc_match.group(1).title()}"
    elif "dr." in prompt.lower():
        words = prompt.split()
        for i, w in enumerate(words):
            if w.lower() in ("dr.", "dr", "doctor") and i + 1 < len(words):
                doctor = f"Dr. {words[i+1].capitalize()}"
                break

    # 2. Hospital / HCO extraction
    hospital = ""
    hosp_match = re.search(r"([A-Z][a-zA-Z\s]+(?:Hospital|Clinic|Medical Center|Health|Infirmary))", prompt)
    if hosp_match:
        hospital = hosp_match.group(1).strip()
    else:
        for common in ["Mount Sinai", "Mayo Clinic", "Cleveland Clinic", "Mercy Hospital", "Memorial Hospital", "General Hospital"]:
            if common.lower() in prompt.lower():
                hospital = common
                break

    # 3. Specialization
    specialization = "Cardiology"
    specs = {
        "cardio": "Cardiology",
        "oncol": "Oncology",
        "neuro": "Neurology",
        "pediat": "Pediatrics",
        "endo": "Endocrinology",
        "rheum": "Rheumatology",
        "ortho": "Orthopedics",
        "psych": "Psychiatry"
    }
    for k, v in specs.items():
        if k in prompt.lower():
            specialization = v
            break

    # 4. Product extraction
    product = "CardioGuard"
    known_products = ["CardioGuard", "OncoShield", "NeuroCalm", "GlucoFlow", "Atorvastatin", "Pembrolizumab", "Metformin"]
    for p in known_products:
        if p.lower() in prompt.lower():
            product = p
            break

    # 5. Samples
    samples = 0
    sample_match = re.search(r"(\d+)\s*(?:sample|samples|units|boxes|vials)", prompt, re.IGNORECASE)
    if sample_match:
        samples = int(sample_match.group(1))

    # 6. Sentiment
    sentiment = "Neutral"
    pos_words = ["interested", "positive", "prescribe", "impressed", "agreed", "great", "promising", "receptive", "excellent"]
    neg_words = ["hesitant", "concern", "side effect", "skeptical", "declined", "expensive", "refused", "competitor"]
    p_count = sum(1 for w in pos_words if w in prompt.lower())
    n_count = sum(1 for w in neg_words if w in prompt.lower())
    if p_count > n_count:
        sentiment = "Positive"
    elif n_count > p_count:
        sentiment = "Negative"

    summary = prompt.strip()[:240] + ("..." if len(prompt.strip()) > 240 else "")
    outcomes = f"Discussed efficacy and clinical trial data for {product}. Physician showed {sentiment.lower()} reception."
    followUp = date.fromordinal(date.today().toordinal() + 14).isoformat()

    return {
        "doctor": doctor or "Dr. Robert Smith",
        "hospital": hospital or "Metro Health Medical Center",
        "specialization": specialization,
        "interactionType": "In-Person Detailing",
        "visitDate": today,
        "visitTime": "10:30",
        "attendees": "Chief Pharmacist, Clinical Fellow",
        "product": product,
        "materials": f"{product} Phase III Clinical Study Monograph",
        "samples": samples,
        "notes": prompt.strip(),
        "sentiment": sentiment,
        "outcomes": outcomes,
        "followUp": followUp,
        "summary": summary,
        "confidence": 88,
        "topics": [specialization, product, "Dosage & Tolerability", "Clinical Efficacy"],
        "suggestions": {
            "nextAction": f"Deliver Phase III comparative trial whitepaper to {doctor or 'physician'}",
            "followUp": followUp,
            "recommendedMaterial": f"{product} Tolerability Profile Sheet",
            "engagementScore": 85 if sentiment == "Positive" else 65,
            "priority": "High" if sentiment == "Positive" else "Medium"
        },
        "intelligence": {
            "prescriptionProbability": 82 if sentiment == "Positive" else 45,
            "visitSuccessScore": 88 if sentiment == "Positive" else 60,
            "competitorRisk": "Low" if sentiment == "Positive" else "Moderate",
            "doctorCategory": "Key Opinion Leader (Tier 1)",
            "businessOpportunity": f"High potential adoption for {specialization} patient cohort."
        },
        "compliance": {
            "ready": bool(doctor and hospital),
            "missingFields": [f for f, v in [("doctor", doctor), ("hospital", hospital)] if not v],
            "risk": "Low" if (doctor and hospital) else "Medium"
        },
        "ai_meta": {
            "mode": "deterministic_fallback",
            "disclaimer": AI_DISCLAIMER
        }
    }

def fallback_assistant(message: str, interaction: dict, history: list) -> Dict[str, Any]:
    """
    Deterministic rule-based response for Copilot quick actions and questions.
    """
    msg_lower = message.lower()
    doc = interaction.get("doctor") or "Dr. Smith"
    prod = interaction.get("product") or "CardioGuard"
    hosp = interaction.get("hospital") or "Metro General"
    follow_date = interaction.get("followUp") or "in 2 weeks"

    if "rewrite summary" in msg_lower:
        text = (
            f"Executive Summary: On {interaction.get('visitDate', 'today')}, conducted an in-depth clinical detailing "
            f"session with {doc} at {hosp} regarding {prod}. Discussed therapeutic efficacy, patient tolerability, "
            f"and clinical outcomes. Feedback was {interaction.get('sentiment', 'Positive').lower()}, with next clinical review scheduled for {follow_date}."
        )
        return {
            "reply": "I have rewritten the summary in formal pharmaceutical detailing format.",
            "generated": text,
            "field": "summary",
            "value": text,
            "ai_meta": {"disclaimer": AI_DISCLAIMER}
        }
    elif "explain sentiment" in msg_lower:
        sent = interaction.get("sentiment", "Positive")
        text = (
            f"Sentiment Analysis: Evaluated as '{sent}'. Factors influencing this rating include physician willingness to evaluate {prod}, "
            f"active inquiry regarding trial data, and agreement on follow-up timeline on {follow_date}."
        )
        return {
            "reply": text,
            "generated": text,
            "ai_meta": {"disclaimer": AI_DISCLAIMER}
        }
    elif "email" in msg_lower or "follow-up email" in msg_lower:
        email = (
            f"Subject: Follow-up: Clinical Discussion on {prod} at {hosp}\n\n"
            f"Dear {doc},\n\n"
            f"Thank you for your valuable time today discussing {prod} and its clinical indications for your patient cohort. "
            f"As agreed, I have enclosed the approved clinical trial summary and safety profile documentation.\n\n"
            f"I look forward to reconnecting with you on {follow_date} to address any further questions from your medical team.\n\n"
            f"Sincerely,\nMedical Representative\nMedIntel Pharma"
        )
        return {
            "reply": "Generated approved physician follow-up email draft.",
            "generated": email,
            "ai_meta": {"disclaimer": AI_DISCLAIMER}
        }
    elif "missing fields" in msg_lower or "compliance" in msg_lower:
        missing = []
        for f in ["doctor", "hospital", "product", "visitDate", "notes"]:
            if not interaction.get(f):
                missing.append(f)
        status_text = "All required PDMA and detailing compliance fields are present." if not missing else f"Missing required fields: {', '.join(missing)}."
        return {
            "reply": status_text,
            "generated": status_text,
            "ai_meta": {"disclaimer": AI_DISCLAIMER}
        }
    elif "visit plan" in msg_lower or "next visit" in msg_lower:
        plan = (
            f"Next Detailing Plan for {doc} ({hosp}):\n"
            f"1. Target Date: {follow_date}\n"
            f"2. Core Agenda: Review patient tolerability data and formulary inclusion status for {prod}.\n"
            f"3. Collateral: Present real-world evidence (RWE) study and comparative efficacy tables.\n"
            f"4. Objective: Secure prescribing commitment for refractory patient group."
        )
        return {
            "reply": "Generated strategic visit detailing plan.",
            "generated": plan,
            "ai_meta": {"disclaimer": AI_DISCLAIMER}
        }
    else:
        general_reply = (
            f"PharmaAI Copilot: I analyzed your request regarding {doc} and {prod}. "
            f"Key recommendation: Maintain active scientific exchange and supply approved clinical documentation before {follow_date}."
        )
        return {
            "reply": general_reply,
            "generated": general_reply,
            "ai_meta": {"disclaimer": AI_DISCLAIMER}
        }
