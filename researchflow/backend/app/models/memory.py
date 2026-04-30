from datetime import datetime, timezone
from typing import Optional

from beanie import Document
from pydantic import Field


class ResearchMemory(Document):
    memory_id: str = Field(..., description="Unique memory identifier", unique=True)
    session_id: str = Field(..., description="Associated session ID")
    agent: str = Field(..., description="Agent that produced the memory entry")
    content: str = Field(..., description="Memory content")
    metadata: dict = Field(default_factory=dict, description="Additional metadata")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "research_memory"
        indexes = [
            "memory_id",
            "session_id",
            "created_at",
        ]
