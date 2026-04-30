import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.utils.logger import logger
from app.models.memory import ResearchMemory


def _truncate(text: str, limit: int = 400) -> str:
    if not text:
        return ""
    text = text.strip()
    if len(text) <= limit:
        return text
    return f"{text[:limit].rstrip()}…"


def add_agent_message(
    state: Dict[str, Any],
    agent: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    messages = list(state.get("messages", []))
    messages.append(
        {
            "agent": agent,
            "content": _truncate(content),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "metadata": metadata or {},
        }
    )
    state["messages"] = messages


def format_agent_messages(state: Dict[str, Any], max_messages: int = 6) -> str:
    messages = state.get("messages", [])
    if not messages:
        return ""
    recent = messages[-max_messages:]
    lines = []
    for msg in recent:
        content = msg.get("content", "")
        agent = msg.get("agent", "agent")
        lines.append(f"- {agent}: {content}")
    return "\n".join(lines)


def format_memory_context(state: Dict[str, Any], max_entries: int = 6) -> str:
    memory = state.get("memory", [])
    if not memory:
        return ""
    recent = memory[-max_entries:]
    lines = []
    for entry in recent:
        content = entry.get("content", "")
        agent = entry.get("agent", "agent")
        lines.append(f"- {agent}: {content}")
    return "\n".join(lines)


async def load_memory_entries(session_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    try:
        entries = (
            await ResearchMemory.find(ResearchMemory.session_id == session_id)
            .sort(+ResearchMemory.created_at)
            .limit(limit)
            .to_list()
        )
        return [
            {
                "memory_id": entry.memory_id,
                "session_id": entry.session_id,
                "agent": entry.agent,
                "content": entry.content,
                "metadata": entry.metadata,
                "created_at": entry.created_at.isoformat(),
            }
            for entry in entries
        ]
    except Exception as exc:
        logger.warning(f"Failed to load memory entries for {session_id}: {exc}")
        return []


async def append_memory_entry(
    state: Dict[str, Any],
    agent: str,
    content: str,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    if not state.get("memory_enabled"):
        return

    session_id = state.get("session_id")
    if not session_id:
        return

    memory_entry = {
        "memory_id": str(uuid.uuid4()),
        "session_id": session_id,
        "agent": agent,
        "content": _truncate(content, limit=800),
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    state_memory = list(state.get("memory", []))
    state_memory.append(memory_entry)
    state["memory"] = state_memory

    try:
        record = ResearchMemory(
            memory_id=memory_entry["memory_id"],
            session_id=session_id,
            agent=agent,
            content=memory_entry["content"],
            metadata=memory_entry["metadata"],
        )
        await record.insert()
    except Exception as exc:
        logger.warning(f"Failed to persist memory entry for {session_id}: {exc}")
