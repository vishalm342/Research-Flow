"""
LangGraph research workflow:
  researcher_primary + researcher_trends → research_merge → writer → critic
  → editor → supervisor → (refiner?) → END

After the graph finishes, if a conversation_id was supplied the final report is
posted back as an assistant Message so the chat UI can display it.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from langgraph.graph import StateGraph, END, START

from app.agents.state import AgentState
from app.agents.researcher import (
    researcher_primary_node,
    researcher_trends_node,
    research_merge_node,
)
from app.agents.writer import writer_node
from app.agents.critic import critic_node
from app.agents.editor import editor_node
from app.agents.supervisor import supervisor_node
from app.agents.refiner import refiner_node
from app.models.research import ResearchSession
from app.utils.logger import logger
from app.agents.context import load_memory_entries


# ---------------------------------------------------------------------------
# Conditional routing helpers
# ---------------------------------------------------------------------------

def _route_after_critic(state: AgentState) -> str:
    """Send back to writer if critic requests rewrite and retries remain."""
    if state.get("critic_decision") == "rewrite" and state.get("retry_count", 0) <= 2:
        return "writer"
    return "editor"


def _route_after_supervisor(state: AgentState) -> str:
    """Supervisor decides between writer, refiner, or END."""
    decision = state.get("router_decision", "end")
    if decision == "writer":
        return "writer"
    if decision == "refiner" and state.get("refinement_query"):
        return "refiner"
    return END


def _route_after_refiner(state: AgentState) -> str:
    return END


# ---------------------------------------------------------------------------
# Build the compiled graph (module-level singleton, reused across requests)
# ---------------------------------------------------------------------------

def _wrap_node_with_running_event(node_func, node_name):
    async def wrapped(state: AgentState):
        session_id = state.get("session_id")
        if session_id:
            try:
                session = await ResearchSession.find_one(ResearchSession.session_id == session_id)
                if session:
                    await session.add_agent_event(node_name, "running", f"{node_name.replace('_', ' ').title()} is now running")
            except Exception as e:
                logger.error(f"Error emitting running event for {node_name}: {e}")
        return await node_func(state)
    return wrapped

def _build_graph():
    builder = StateGraph(AgentState)

    builder.add_node("researcher_primary", _wrap_node_with_running_event(researcher_primary_node, "researcher_primary"))
    builder.add_node("researcher_trends", _wrap_node_with_running_event(researcher_trends_node, "researcher_trends"))
    builder.add_node("research_merge", _wrap_node_with_running_event(research_merge_node, "research_merge"))
    builder.add_node("writer", _wrap_node_with_running_event(writer_node, "writer"))
    builder.add_node("critic", _wrap_node_with_running_event(critic_node, "critic"))
    builder.add_node("editor", _wrap_node_with_running_event(editor_node, "editor"))
    builder.add_node("supervisor", _wrap_node_with_running_event(supervisor_node, "supervisor"))
    builder.add_node("refiner", _wrap_node_with_running_event(refiner_node, "refiner"))

    builder.add_edge(START, "researcher_primary")
    builder.add_edge(START, "researcher_trends")
    builder.add_edge("researcher_primary", "research_merge")
    builder.add_edge("researcher_trends", "research_merge")
    builder.add_edge("research_merge", "writer")
    builder.add_edge("writer", "critic")
    builder.add_conditional_edges(
        "critic",
        _route_after_critic,
        {
            "writer": "writer",
            "editor": "editor",
        },
    )
    builder.add_edge("editor", "supervisor")
    builder.add_conditional_edges(
        "supervisor",
        _route_after_supervisor,
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
# Sequential status event emission
# ---------------------------------------------------------------------------

async def _emit_sequential_status_events(session_id: str, final_state: AgentState) -> None:
    try:
        session = await ResearchSession.find_one(ResearchSession.session_id == session_id)
        if session:
            session.status = "complete"
            session.progress = 100
            await session.save()
            logger.info(f"[{session_id}] Emitted status: workflow_complete")
    except Exception as e:
        logger.error(f"[{session_id}] Failed to emit status events: {e}")




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
        refinement_query = getattr(session, "refinement_query", None)
        memory_enabled = getattr(session, "memory_enabled", False)
        memory_entries = await load_memory_entries(session_id) if memory_enabled else []

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
            "refinement_query": refinement_query,
            "draft_quality_score": None,
            "critic_decision": None,
            "critic_feedback": None,
            "router_decision": None,
            "search_results_primary": [],
            "search_results_secondary": [],
            "scraped_content_primary": [],
            "scraped_content_secondary": [],
            "research_errors": [],
            "messages": [],
            "memory_enabled": memory_enabled,
            "memory": memory_entries,
        }

        logger.info(f"[{session_id}] Starting research workflow — topic: {topic!r}")
        final_state = initial_state
        async for output in _compiled_graph.astream(initial_state):
            for node_name, state_update in output.items():
                if isinstance(state_update, dict):
                    final_state.update(state_update)
                sess = await ResearchSession.find_one(ResearchSession.session_id == session_id)
                if sess:
                    decision_data = None
                    msg = f"Completed step: {node_name}"
                    if node_name == "critic":
                        decision_data = {"decision": final_state.get("critic_decision")}
                        msg = f"Decision: {final_state.get('critic_decision')}"
                    elif node_name == "supervisor":
                        decision_data = {"decision": final_state.get("router_decision")}
                        msg = f"Routed to: {final_state.get('router_decision')}"
                    
                    await sess.add_agent_event(node_name, "complete", msg, decision_data)
        logger.info(f"[{session_id}] Research workflow finished")
        
        # ------------------------------------------------------------------
        # 1.5. Emit sequential status events for all agents
        # ------------------------------------------------------------------
        # After the graph completes, emit status events in strict sequence
        await _emit_sequential_status_events(session_id, final_state)

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
                fresh_session = await ResearchSession.find_one(ResearchSession.session_id == session_id)
                report_message = Message(
                    message_id=str(uuid.uuid4()),
                    conversation_id=conversation_id,
                    role="assistant",
                    content=final_report,
                    created_at=datetime.now(timezone.utc),
                    metadata={
                        "type": "research_report",
                        "research_id": session_id,
                        "report_id": fresh_session.report_id if fresh_session else None,
                        "quality_score": fresh_session.quality_score if fresh_session else None,
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
