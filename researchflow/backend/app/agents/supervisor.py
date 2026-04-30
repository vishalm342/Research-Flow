import json
import re
from typing import Dict, Any

from app.agents.state import AgentState
from app.agents.context import (
    add_agent_message,
    append_memory_entry,
    format_agent_messages,
    format_memory_context,
)
from app.tools.llm import call_llm
from app.utils.logger import logger


def _parse_router_response(response: str) -> Dict[str, Any]:
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", response, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

    lowered = response.lower()
    if "refiner" in lowered:
        decision = "refiner"
    elif "writer" in lowered or "rewrite" in lowered:
        decision = "writer"
    else:
        decision = "end"
    return {"next_step": decision, "reason": response.strip()}


async def supervisor_node(state: AgentState) -> AgentState:
    """
    Supervisor router node - decides whether to rewrite, refine, or end.
    """
    try:
        refinement_query = (state.get("refinement_query") or "").strip()
        retry_count = state.get("retry_count", 0)
        final_report = state.get("final_report", "")
        critic_feedback = state.get("critic_feedback", "")

        agent_context = format_agent_messages(state)
        memory_context = format_memory_context(state)
        context_block = ""
        if agent_context:
            context_block += f"\n\nAgent Notes:\n{agent_context}"
        if memory_context:
            context_block += f"\n\nMemory:\n{memory_context}"

        prompt = f"""You are the workflow supervisor for a LangGraph research pipeline.

User intent:
- Topic: {state.get("topic", "")}
- Refinement query: {refinement_query or "none"}

Signals:
- Retry attempts so far: {retry_count}
- Final report length: {len(final_report.split())} words
- Critic feedback: {critic_feedback or "none"}
{context_block}

Decide the next step from: "writer", "refiner", or "end".
Rules:
- Choose "refiner" only if a refinement query exists.
- Choose "writer" if the report is missing or needs a rewrite and retries remain.
- Otherwise choose "end".

Return ONLY valid JSON with:
  "next_step": "writer" | "refiner" | "end",
  "reason": short explanation.
"""

        response = await call_llm(prompt)
        parsed = _parse_router_response(response)
        decision = str(parsed.get("next_step", "end")).lower()
        reason = parsed.get("reason", "").strip()

        if decision not in {"writer", "refiner", "end"}:
            decision = "end"

        if decision == "refiner" and not refinement_query:
            decision = "end"

        if decision == "writer" and retry_count >= 2:
            decision = "end"

        state["router_decision"] = decision
        state["current_step"] = "supervisor_complete"

        add_agent_message(
            state,
            "supervisor",
            reason or f"Supervisor routed to {decision}.",
            {"decision": decision},
        )
        await append_memory_entry(
            state,
            "supervisor",
            reason or f"Supervisor routed to {decision}.",
            {"decision": decision},
        )
        return state

    except Exception as exc:
        error_msg = f"Supervisor node failed: {exc}"
        logger.error(error_msg)
        state["error"] = error_msg
        state["router_decision"] = "end"
        state["current_step"] = "supervisor_failed"
        add_agent_message(state, "supervisor", error_msg, {"decision": "end"})
        return state
