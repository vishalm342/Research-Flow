import uuid
from datetime import datetime, timezone
from app.agents.state import AgentState
from app.agents.context import (
    add_agent_message,
    append_memory_entry,
    format_agent_messages,
    format_memory_context,
)
from app.tools.llm import call_llm
from app.models.research import Report, ResearchSession
from app.utils.logger import logger


async def editor_node(state: AgentState) -> AgentState:
    """
    Editor agent node - reviews and polishes the draft report.
    
    Note: Status updates are now handled by the workflow orchestration layer
    to ensure strict sequential ordering of status events.
    """
    try:
        session_id = state["session_id"]
        draft_report = state["draft_report"]
        topic = state["topic"]

        logger.info(f"Editor node started for session {session_id}")

        word_count = len(draft_report.split())
        logger.info(f"Draft report word count: {word_count}")
        logger.info("Draft report approved by critic, polishing...")

        critic_feedback = state.get("critic_feedback", "")
        agent_notes = format_agent_messages(state)
        memory_notes = format_memory_context(state)
        notes_block = ""
        if critic_feedback:
            notes_block += f"\n\nCritic feedback:\n{critic_feedback}"
        if agent_notes:
            notes_block += f"\n\nAgent Notes:\n{agent_notes}"
        if memory_notes:
            notes_block += f"\n\nMemory:\n{memory_notes}"

        polish_prompt = f"""Review and polish this research report for clarity, grammar, and flow:

{draft_report}
{notes_block}

Improve the structure, fix any grammatical errors, enhance readability, and ensure all sections flow logically. Maintain all citations and sources."""
        

        final_report = await call_llm(polish_prompt)
        import re as _re
        _wc = len(final_report.split())
        _sc = min(len(state.get("search_results", [])), 3) if "sources" not in locals() else min(len(sources), 3)
        _hc = 1.0 if "##" in final_report else 0.0
        _cc = 1.0 if len(_re.findall(r'https?://', final_report)) >= 3 else 0.0
        _lc = 2.0 if _wc >= 2000 else (1.5 if _wc >= 1000 else 1.0)
        quality_score = round(min(_lc + _sc + _hc + _cc, 10.0), 1)
        logger.info(f"Final report generated: {len(final_report)} characters")

        report_id = str(uuid.uuid4())
        sources = state.get("search_results", [])

        report = Report(
            report_id=report_id,
            session_id=session_id,
            topic=topic,
            content=final_report,
            sources=sources,
            word_count=len(final_report.split()),
            quality_score=quality_score,
            created_at=datetime.now(timezone.utc),
        )
        await report.insert()

        logger.info(f"Report saved to database with ID: {report_id}")

        # Update session with final report info (but NOT status - that's handled by orchestration)
        session = await ResearchSession.find_one(ResearchSession.session_id == session_id)
        if session:
            session.report_id = report_id
            session.quality_score = quality_score
            await session.save()

        state["final_report"] = final_report
        state["current_step"] = "complete"
        state["error"] = None

        add_agent_message(
            state,
            "editor",
            f"Polished report with {len(final_report.split())} words.",
            {"quality_score": quality_score},
        )
        await append_memory_entry(
            state,
            "editor",
            f"Polished report with {len(final_report.split())} words.",
            {"quality_score": quality_score},
        )

        logger.info(f"Editor node completed for session {session_id}")
        return state

    except Exception as e:
        error_msg = f"Editor node failed: {str(e)}"
        logger.error(error_msg)

        state["error"] = error_msg
        state["current_step"] = "editor_failed"

        try:
            session_id = state.get("session_id")
            if session_id:
                session = await ResearchSession.find_one(ResearchSession.session_id == session_id)
                if session:
                    session.status = "failed"
                    session.error_message = error_msg
                    await session.save()
        except Exception as db_error:
            logger.error(f"Failed to update session status in DB: {db_error}")

        return state
