"""
LangGraph research workflow:
  researcher → writer → editor → (refiner?) → END

After the graph finishes, if a conversation_id was supplied the final report is
posted back as an assistant Message so the chat UI can display it.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from langgraph.graph import StateGraph, END, START

from app.agents.state import AgentState
from app.agents.researcher import researcher_node
from app.agents.writer import writer_node
from app.agents.editor import editor_node
from app.agents.refiner import refiner_node
from app.models.research import ResearchSession
from app.utils.logger import logger


# ---------------------------------------------------------------------------
# Conditional routing helpers
# ---------------------------------------------------------------------------

def _route_after_editor(state: AgentState) -> str:
    """Send to refiner if a refinement_query exists, else go to END."""
    if state.get("refinement_query"):
        return "refiner"
    if state.get("current_step") == "needs_rewrite":
        return "writer"
    return END


def _route_after_refiner(state: AgentState) -> str:
    return END


# ---------------------------------------------------------------------------
# Build the compiled graph (module-level singleton, reused across requests)
# ---------------------------------------------------------------------------

def _build_graph():
    builder = StateGraph(AgentState)

    builder.add_node("researcher", researcher_node)
    builder.add_node("writer", writer_node)
    builder.add_node("editor", editor_node)
    builder.add_node("refiner", refiner_node)

    builder.add_edge(START, "researcher")
    builder.add_edge("researcher", "writer")
    builder.add_edge("writer", "editor")
    builder.add_conditional_edges(
        "editor",
        _route_after_editor,
        {
            "writer": "writer",
            "refiner": "refiner",
            END: END,
        },
    )
    builder.add_conditional_edges(
        "refiner",
        _route_after_refiner,
        {END: END},
    )

    return builder.compile()


_compiled_graph = _build_graph()


# ---------------------------------------------------------------------------
# Public entry-point called by the background task
# ---------------------------------------------------------------------------

async def run_research_workflow(
    session_id: str,
    conversation_id: Optional[str] = None,
) -> None:
    """
    Execute the full pipeline for *session_id*.

    Parameters
    ----------
    session_id:
        The ``ResearchSession`` to drive.
    conversation_id:
        When provided (i.e. the workflow was triggered from the chat UI),
        the final report will be posted back as an ``assistant`` Message
        inside that conversation.
    """
    # Lazy import to avoid circular dependency at module load time
    from app.models.message import Message
    from app.models.conversation import Conversation

    try:
        # ------------------------------------------------------------------
        # 1. Load session
        # ------------------------------------------------------------------
        session = await ResearchSession.find_one(
            ResearchSession.session_id == session_id
        )
        if not session:
            logger.error(f"Session not found: {session_id}")
            return

        topic = session.topic
        depth = getattr(session, "depth", "medium")

        initial_state: AgentState = {
            "session_id": session_id,
            "topic": topic,
            "depth": depth,
            "search_results": [],
            "scraped_content": [],
            "draft_report": "",
            "final_report": "",
            "sources": [],
            "current_step": "start",
            "retry_count": 0,
            "error": None,
            # refinement_query is not set here; it can be injected later
        }

        logger.info(f"[{session_id}] Starting research workflow — topic: {topic!r}")
        final_state: AgentState = await _compiled_graph.ainvoke(initial_state)
        logger.info(f"[{session_id}] Research workflow finished")

        # ------------------------------------------------------------------
        # 2. Post the finished report back to the chat conversation (if any)
        # ------------------------------------------------------------------
        if conversation_id and final_state.get("final_report"):
            final_report: str = final_state["final_report"]

            # Verify conversation still exists
            conversation = await Conversation.find_one(
                Conversation.conversation_id == conversation_id
            )
            if conversation:
                report_message = Message(
                    message_id=str(uuid.uuid4()),
                    conversation_id=conversation_id,
                    role="assistant",
                    content=final_report,
                    created_at=datetime.now(timezone.utc),
                    metadata={
                        "type": "research_report",
                        "research_id": session_id,
                        "report_id": getattr(session, "report_id", None),
                        "topic": topic,
                    },
                )
                await report_message.insert()

                # Keep conversation counters up to date
                conversation.message_count += 1
                conversation.updated_at = datetime.now(timezone.utc)
                await conversation.save()

                logger.info(
                    f"[{session_id}] Report posted to conversation {conversation_id} "
                    f"as message {report_message.message_id}"
                )
            else:
                logger.warning(
                    f"[{session_id}] conversation_id={conversation_id} not found; "
                    "skipping report post-back."
                )

    except Exception as exc:
        error_msg = f"Research workflow exception: {exc}"
        logger.error(error_msg)
        try:
            session = await ResearchSession.find_one(
                ResearchSession.session_id == session_id
            )
            if session:
                session.status = "failed"
                session.error_message = error_msg
                await session.save()
        except Exception as db_exc:
            logger.error(
                f"Failed to persist error for session {session_id}: {db_exc}"
            )
