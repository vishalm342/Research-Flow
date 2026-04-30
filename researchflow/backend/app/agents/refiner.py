from app.agents.state import AgentState
from app.agents.context import add_agent_message, append_memory_entry, format_memory_context
from app.tools.llm import call_llm
from app.models.research import ResearchSession
from app.utils.logger import logger


async def refiner_node(state: AgentState) -> AgentState:
    """
    Refiner agent node – rewrites the final report to focus on a user-supplied
    refinement query.
    
    Note: Status updates are now handled by the workflow orchestration layer
    to ensure strict sequential ordering of status events.

    Expects
    -------
    state["final_report"]      : str  – the polished report from the editor.
    state["refinement_query"]  : str  – the aspect the user wants to home in on.

    Returns
    -------
    Updated AgentState with ``final_report`` replaced by the refined version.
    """
    try:
        session_id = state["session_id"]
        final_report = state.get("final_report", "")
        refinement_query = state.get("refinement_query", "")

        logger.info(
            f"Refiner node started for session {session_id} "
            f"– refinement query: {refinement_query!r}"
        )

        if not final_report:
            logger.warning("Refiner received an empty report – skipping refinement.")
            state["current_step"] = "complete"
            return state

        if not refinement_query:
            logger.warning("No refinement query provided – skipping refinement.")
            state["current_step"] = "complete"
            return state

        memory_notes = format_memory_context(state)
        memory_block = f"\n\nMemory:\n{memory_notes}" if memory_notes else ""

        prompt = f"""You are an expert research editor performing a targeted refinement.

The user wants you to focus the following research report specifically on:
"{refinement_query}"

Original Report:
{final_report}

Instructions:
- Rewrite the report so that every section is directly relevant to "{refinement_query}".
- Remove or condense sections that are not relevant to the refinement query.
- Keep all citations and source references intact.
- Maintain the same Markdown formatting.
- Preserve depth and accuracy – do not sacrifice quality for brevity.

{memory_block}

Return ONLY the refined report in Markdown format."""

        logger.info("Calling LLM for report refinement")
        refined_report = await call_llm(prompt)
        logger.info(f"Refined report generated: {len(refined_report)} characters")

        state["final_report"] = refined_report
        state["current_step"] = "complete"
        state["error"] = None

        add_agent_message(
            state,
            "refiner",
            f"Refined report with {len(refined_report.split())} words.",
            {"refinement_query": refinement_query},
        )
        await append_memory_entry(
            state,
            "refiner",
            f"Refined report with {len(refined_report.split())} words.",
            {"refinement_query": refinement_query},
        )

        logger.info(f"Refiner node completed for session {session_id}")
        return state

    except Exception as e:
        error_msg = f"Refiner node failed: {str(e)}"
        logger.error(error_msg)

        state["error"] = error_msg
        state["current_step"] = "refiner_failed"

        try:
            session_id = state.get("session_id")
            if session_id:
                session = await ResearchSession.find_one(
                    ResearchSession.session_id == session_id
                )
                if session:
                    session.status = "failed"
                    session.error_message = error_msg
                    await session.save()
        except Exception as db_error:
            logger.error(f"Failed to update session status in DB: {db_error}")

        return state
