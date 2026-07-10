from langgraph.graph import StateGraph, END

from .state import InteractionState

from .nodes import (
    extract_interaction,
    analyze_interaction,
    generate_suggestions,
    visit_intelligence,
    compliance_check,
    format_response,
)

builder = StateGraph(InteractionState)

builder.add_node("extract", extract_interaction)
builder.add_node("analysis", analyze_interaction)
builder.add_node("suggestions", generate_suggestions)
builder.add_node("intelligence", visit_intelligence)
builder.add_node("compliance", compliance_check)
builder.add_node("formatter", format_response)

builder.set_entry_point("extract")

builder.add_edge("extract", "analysis")
builder.add_edge("analysis", "suggestions")
builder.add_edge("suggestions", "intelligence")
builder.add_edge("intelligence", "compliance")
builder.add_edge("compliance", "formatter")
builder.add_edge("formatter", END)

graph = builder.compile()