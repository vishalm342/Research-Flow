from beanie import Document
from pydantic import Field
from datetime import datetime, timezone

class Conversation(Document):
    conversation_id: str = Field(..., unique=True, index=True)
    user_session: str = "anon"
    title: str = "New Conversation"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    message_count: int = 0
    status: str = "active"
    is_pinned: bool = False  # The new field we wanted to add

    class Settings:
        name = "conversations"
        indexes = [
            "conversation_id",
            "user_session"
        ]