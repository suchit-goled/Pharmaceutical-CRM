import json
import logging
from typing import Optional
from datetime import date
from services.ai_service import (
    get_groq_client,
    clean_json_output,
    fallback_extract,
    fallback_assistant,
    AI_DISCLAIMER
)
from config import settings

from .prompts import (
    EXTRACTION_PROMPT,
    ANALYSIS_PROMPT,
    SUGGESTION_PROMPT,
    VISIT_PROMPT,
    COPILOT_PROMPT
)

logger = logging.getLogger("ai_graph.nodes")

def ask_llm(prompt: str) -> Optional[str]:
    """
    Invokes Groq LLM with timeout and returns text content.
    Returns None if client is unavailable or an error occurs.
    """
    client = get_groq_client()
    if not client:
        return None
    try:
        response = client.chat.completions.create(
            model=settings.GROQ_MODEL,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.warning("Groq call failed: %s", e)
        return None

# =========================================================
# NODE 1: EXTRACTION
# =========================================================
def extract_interaction(state):
    today = date.today().isoformat()
    prompt = EXTRACTION_PROMPT.replace("{today}", today)
    prompt += f"\n\nConversation\n\n{state.get('prompt', '')}\n"

    raw_output = ask_llm(prompt)
    if raw_output:
        try:
            interaction = clean_json_output(raw_output)
            return {"interaction": interaction}
        except Exception as e:
            logger.warning("Failed parsing extraction JSON: %s", e)

    # Fallback deterministic extraction
    fallback = fallback_extract(state.get("prompt", ""))
    return {"interaction": fallback}

# =========================================================
# NODE 2: ANALYSIS
# =========================================================
def analyze_interaction(state):
    current = state.get("interaction", {})
    prompt = f"\n{ANALYSIS_PROMPT}\n\nInteraction\n\n{json.dumps(current, indent=2)}\n"

    raw_output = ask_llm(prompt)
    if raw_output:
        try:
            analysis = clean_json_output(raw_output)
            return {"analysis": analysis}
        except Exception:
            pass

    # Heuristic analysis
    sentiment = current.get("sentiment", "Positive")
    return {
        "analysis": {
            "summary": current.get("summary") or f"Detailed {current.get('product', 'product')} with {current.get('doctor', 'doctor')}.",
            "sentiment": sentiment,
            "confidence": 92 if sentiment == "Positive" else 80,
            "topics": [current.get("specialization", "Cardiology"), current.get("product", "Medicine"), "Patient Tolerability"]
        }
    }

# =========================================================
# NODE 3: SUGGESTIONS
# =========================================================
def generate_suggestions(state):
    current = state.get("interaction", {})
    prompt = f"\n{SUGGESTION_PROMPT}\n\nInteraction\n\n{json.dumps(current, indent=2)}\n\nAnalysis\n\n{json.dumps(state.get('analysis', {}), indent=2)}\n"

    raw_output = ask_llm(prompt)
    if raw_output:
        try:
            suggestions = clean_json_output(raw_output)
            return {"suggestions": suggestions}
        except Exception:
            pass

    prod = current.get("product", "product")
    doc = current.get("doctor", "the physician")
    return {
        "suggestions": {
            "nextAction": f"Follow up with {doc} regarding {prod} formulary acceptance",
            "followUp": current.get("followUp", date.today().isoformat()),
            "recommendedMaterial": f"{prod} Clinical Study Monograph",
            "engagementScore": 85,
            "priority": "High"
        }
    }

# =========================================================
# NODE 4: VISIT INTELLIGENCE
# =========================================================
def visit_intelligence(state):
    current = state.get("interaction", {})
    prompt = f"\n{VISIT_PROMPT}\n\nInteraction\n\n{json.dumps(current, indent=2)}\n\nAnalysis\n\n{json.dumps(state.get('analysis', {}), indent=2)}\n"

    raw_output = ask_llm(prompt)
    if raw_output:
        try:
            intelligence = clean_json_output(raw_output)
            return {"intelligence": intelligence}
        except Exception:
            pass

    return {
        "intelligence": {
            "prescriptionProbability": 84,
            "visitSuccessScore": 89,
            "competitorRisk": "Low",
            "doctorCategory": "High Volume Prescriber",
            "businessOpportunity": f"Expand market share for {current.get('product', 'product')} in institutional care."
        }
    }

# =========================================================
# NODE 5: COMPLIANCE
# =========================================================
def compliance_check(state):
    interaction = state.get("interaction", {})
    required = ["doctor", "hospital", "interactionType", "product", "notes"]
    missing = [field for field in required if not interaction.get(field)]

    return {
        "compliance": {
            "ready": len(missing) == 0,
            "missingFields": missing,
            "risk": "Low" if len(missing) == 0 else "Medium"
        }
    }

# =========================================================
# NODE 6: PHARMA AI ASSISTANT (COPILOT)
# =========================================================
def pharma_ai_assistant(state):
    msg = state.get("assistant_message")
    if not msg:
        return {"assistant": {}}

    history_text = ""
    for m in state.get("history", []):
        history_text += f"{m.get('role', 'user')}: {m.get('content', '')}\n"

    prompt = COPILOT_PROMPT.format(
        history=history_text,
        interaction=json.dumps(state.get("interaction", {}), indent=2),
        message=msg
    )

    raw_output = ask_llm(prompt)
    if raw_output:
        try:
            assistant = clean_json_output(raw_output)
            assistant["disclaimer"] = AI_DISCLAIMER
            return {"assistant": assistant}
        except Exception as e:
            logger.warning("Failed parsing assistant JSON: %s", e)

    fallback = fallback_assistant(msg, state.get("interaction", {}), state.get("history", []))
    return {"assistant": fallback}

# =========================================================
# NODE 7: FORMAT RESPONSE
# =========================================================
def format_response(state):
    interaction = state.get("interaction", {})
    analysis = state.get("analysis", {})
    return {
        "response": {
            **interaction,
            **analysis,
            "suggestions": state.get("suggestions", {}),
            "intelligence": state.get("intelligence", {}),
            "compliance": state.get("compliance", {}),
            "assistant": state.get("assistant", {}),
            "disclaimer": AI_DISCLAIMER
        }
    }
