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


def _parse_critic_response(response: str) -> Dict[str, Any]:
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", response, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(0))
            except json.JSONDecodeError:
                pass

    decision = "rewrite" if "rewrite" in response.lower() else "accept"
    score_match = re.search(r"(\d+(?:\.\d+)?)", response)
    score = float(score_match.group(1)) if score_match else 0.0
    return {"decision": decision, "score": score, "reason": response.strip()}


async def critic_node(state: AgentState) -> AgentState:
    """
    Critic agent node - evaluates draft quality and decides whether to rewrite.
    """
    try:
        draft_report = state.get("draft_report", "")
        topic = state.get("topic", "")
        retry_count = state.get("retry_count", 0)

        if not draft_report:
            state["critic_decision"] = "rewrite"
            state["critic_feedback"] = "Draft report was empty."
            state["draft_quality_score"] = 0.0
            if retry_count < 2:
                state["retry_count"] = retry_count + 1
            add_agent_message(
                state,
                "critic",
                "Draft was empty; requesting rewrite.",
                {"decision": "rewrite"},
            )
            await append_memory_entry(
                state,
                "critic",
                "Draft was empty; requesting rewrite.",
                {"decision": "rewrite"},
            )
            return state

        agent_context = format_agent_messages(state)
        memory_context = format_memory_context(state)
        context_block = ""
        if agent_context:
            context_block += f"\n\nAgent Notes:\n{agent_context}"
        if memory_context:
            context_block += f"\n\nMemory:\n{memory_context}"

        prompt = f"""You are a strict research critic evaluating a draft report.

Topic: {topic}
Draft word count: {len(draft_report.split())}
Retry attempts so far: {retry_count}
{context_block}

Evaluate the draft against these criteria:
- Target length: 1200+ words with complete sections.
- Clear structure with Introduction, Background, Key Findings, Detailed Analysis, Implications, Conclusion.
- Specific, grounded statements with sources or evidence.

Return ONLY valid JSON with:
  "score": number from 0 to 10,
  "decision": "accept" or "rewrite",
  "reason": brief feedback,
  "missing_sections": list of any missing sections.
"""

        response = await call_llm(prompt)
        parsed = _parse_critic_response(response)

        decision = str(parsed.get("decision", "accept")).lower()
        if decision not in {"accept", "rewrite"}:
            decision = "accept"

        score = parsed.get("score", 0.0)
        try:
            score = float(score)
        except (TypeError, ValueError):
            score = 0.0

        feedback = parsed.get("reason", "").strip()

        if decision == "rewrite":
            state["retry_count"] = retry_count + 1

        state["draft_quality_score"] = score
        state["critic_decision"] = decision
        state["critic_feedback"] = feedback
        state["current_step"] = "critic_complete"

        add_agent_message(
            state,
            "critic",
            feedback or "Critic completed evaluation.",
            {"decision": decision, "score": score},
        )
        await append_memory_entry(
            state,
            "critic",
            feedback or "Critic completed evaluation.",
            {"decision": decision, "score": score},
        )
        return state

    except Exception as exc:
        error_msg = f"Critic node failed: {exc}"
        logger.error(error_msg)
        state["error"] = error_msg
        state["current_step"] = "critic_failed"
        add_agent_message(state, "critic", error_msg, {"decision": "rewrite"})
        return state
