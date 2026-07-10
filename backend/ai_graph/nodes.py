import json
import os
import re

from groq import Groq
from dotenv import load_dotenv
from datetime import date

from .prompts import (
    EXTRACTION_PROMPT,
    ANALYSIS_PROMPT,
    SUGGESTION_PROMPT,
    VISIT_PROMPT,
    COPILOT_PROMPT
)

load_dotenv()

client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)

MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)


# ---------------------------------------------------------
# Utilities
# ---------------------------------------------------------



def clean_json(text: str):

    match = re.search(r"\{.*\}", text, re.DOTALL)

    if not match:
        raise Exception(f"LLM did not return JSON:\n{text}")

    return json.loads(match.group())


def ask_llm(prompt: str):

    response = client.chat.completions.create(

        model=MODEL,

        temperature=0,

        messages=[

            {

                "role": "user",

                "content": prompt

            }

        ]

    )

    return response.choices[0].message.content


# =========================================================
# NODE 1
# EXTRACTION
# =========================================================


def extract_interaction(state):

    today = date.today().isoformat()

    # Replace only the {today} placeholder
    prompt = EXTRACTION_PROMPT.replace("{today}", today)

    # Add the user's conversation
    prompt += f"""

Conversation

{state["prompt"]}

"""

    print("\n========== EXTRACTION PROMPT ==========\n")
    print(prompt)
    print("\n=======================================\n")

    # Call LLM
    output = ask_llm(prompt)

    print("\n========== EXTRACTION OUTPUT ==========\n")
    print(output)
    print("\n=======================================\n")

    # Parse JSON
    interaction = clean_json(output)

    return {
        "interaction": interaction
    }

# =========================================================
# NODE 2
# ANALYSIS
# =========================================================
def analyze_interaction(state):

    prompt = f"""

{ANALYSIS_PROMPT}

Interaction

{json.dumps(state["interaction"], indent=2)}

"""

    output = ask_llm(prompt)

    print("\n=========== EXTRACTION OUTPUT ===========")
    print(output)
    print("=========================================")
    analysis = clean_json(output)

    return {

        "analysis": analysis

    }


# =========================================================
# NODE 3
# SUGGESTIONS
# =========================================================

def generate_suggestions(state):

    prompt = f"""

{SUGGESTION_PROMPT}

Interaction

{json.dumps(state["interaction"], indent=2)}

Analysis

{json.dumps(state["analysis"], indent=2)}

"""

    output = ask_llm(prompt)

    suggestions = clean_json(output)

    return {

        "suggestions": suggestions

    }


# =========================================================
# NODE 4
# VISIT INTELLIGENCE
# =========================================================

def visit_intelligence(state):

    prompt = f"""

{VISIT_PROMPT}

Interaction

{json.dumps(state["interaction"], indent=2)}

Analysis

{json.dumps(state["analysis"], indent=2)}

Suggestions

{json.dumps(state["suggestions"], indent=2)}

"""

    output = ask_llm(prompt)

    intelligence = clean_json(output)

    return {

        "intelligence": intelligence

    }


# =========================================================
# NODE 5
# COMPLIANCE
# =========================================================

def compliance_check(state):

    interaction = state["interaction"]

    required = [

        "doctor",

        "hospital",

        "interactionType",

        "product",

        "notes"

    ]

    missing = []

    for field in required:

        if not interaction.get(field):

            missing.append(field)

    return {

        "compliance": {

            "ready": len(missing) == 0,

            "missingFields": missing,

            "risk": "Low" if len(missing) == 0 else "Medium"

        }

    }


# =========================================================
# NODE 6
# PHARMA AI ASSISTANT
# =========================================================

def pharma_ai_assistant(state):
    """
    Runs ONLY when assistant_message exists.
    """

    if not state.get("assistant_message"):
        return {
            "assistant": {}
        }

    # -----------------------------
    # Build conversation history
    # -----------------------------
    history_text = ""

    for msg in state.get("history", []):
        history_text += (
            f'{msg["role"]}: {msg["content"]}\n'
        )

    # -----------------------------
    # Create prompt
    # -----------------------------
    prompt = COPILOT_PROMPT.format(
        history=history_text,
        interaction=json.dumps(
            state["interaction"],
            indent=2
        ),
        message=state["assistant_message"]
    )

    print("\n========== COPILOT PROMPT ==========")
    print(prompt)
    print("====================================\n")

    # -----------------------------
    # Ask Groq
    # -----------------------------
    output = ask_llm(prompt)

    print("\n========== COPILOT OUTPUT ==========")
    print(output)
    print("====================================\n")

    assistant = clean_json(output)

    return {
        "assistant": assistant
    }


# =========================================================
# NODE 7
# FORMAT RESPONSE
# =========================================================

def format_response(state):

    return {

        "response": {

            **state["interaction"],

            **state["analysis"],

            "suggestions": state.get(

                "suggestions",

                {}

            ),

            "intelligence": state.get(

                "intelligence",

                {}

            ),

            "compliance": state.get(

                "compliance",

                {}

            ),

            "assistant": state.get(

                "assistant",

                {}

            )

        }

    }