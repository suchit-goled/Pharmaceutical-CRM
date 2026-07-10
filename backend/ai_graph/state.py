from typing import TypedDict

class InteractionState(TypedDict):

    # User Conversation
    prompt: str

    # Chat message after generation
    assistant_message: str

    # Current interaction
    interaction: dict

    # AI Analysis
    analysis: dict

    # Suggestions
    suggestions: dict

    # Visit Intelligence
    intelligence: dict

    # Compliance
    compliance: dict

    # PharmaAI Assistant
    assistant: dict

    # Final Response
    response: dict

    chat_history: list