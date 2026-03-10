import uuid
from datetime import datetime, timezone
from app.agents.state import AgentState
from app.tools.llm import call_llm
from app.models.research import Report, ResearchSession
from app.utils.logger import logger


async def editor_node(state: AgentState) -> AgentState:
    """
    Editor agent node - reviews and polishes the draft report.
    """
    try:
        session_id = state["session_id"]
        draft_report = state["draft_report"]
        topic = state["topic"]

        logger.info(f"Editor node started for session {session_id}")

        session = await ResearchSession.find_one(ResearchSession.session_id == session_id)
        if session:
            session.status = "editor_running"
            session.progress = 70
            session.current_agent = "editor"
            await session.save()

        word_count = len(draft_report.split())
        logger.info(f"Draft report word count: {word_count}")

        if word_count < 500 and state["retry_count"] < 2:
            logger.warning(f"Draft report too short ({word_count} words), requesting rewrite")

            state["retry_count"] += 1
            state["current_step"] = "needs_rewrite"

            if session:
                session.status = "writer_running"
                session.progress = 50
                session.current_agent = "editor"
                await session.save()

            return state

        logger.info("Draft report quality acceptable, polishing...")

        polish_prompt = f"""Review and polish this research report for clarity, grammar, and flow:

{draft_report}

Improve the structure, fix any grammatical errors, enhance readability, and ensure all sections flow logically. Maintain all citations and sources."""

        final_report = await call_llm(polish_prompt)
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
            created_at=datetime.now(timezone.utc),
        )
        await report.insert()

        logger.info(f"Report saved to database with ID: {report_id}")

        if session:
            session.status = "complete"
            session.progress = 100
            session.current_agent = "editor"
            session.report_id = report_id
            await session.save()

        state["final_report"] = final_report
        state["current_step"] = "complete"
        state["error"] = None

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