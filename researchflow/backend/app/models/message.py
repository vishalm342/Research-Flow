from datetime import datetime, timezone
from typing import Optional

from beanie import Document
from pydantic import Field


class Message(Document):
    message_id: str = Field(..., description="Unique message identifier")
    conversation_id: str = Field(..., description="Parent conversation identifier")
    role: str = Field(..., description="Message role: 'user', 'assistant', or 'system'")
    content: str = Field(..., description="Message content")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: dict = Field(default_factory=dict, description="Additional metadata")

    class Settings:
        name = "messages"
        indexes = [
            "message_id",
            "conversation_id",
        ]