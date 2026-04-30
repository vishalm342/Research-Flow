from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ConversationResponse(BaseModel):
    conversation_id: str
    user_session: str
    title: str
    is_pinned: bool
    created_at: datetime
    updated_at: datetime
    message_count: int
    status: str


class ConversationUpdateRequest(BaseModel):
    title: Optional[str] = None
    is_pinned: Optional[bool] = None


class MessageRequest(BaseModel):
    content: str
    trigger_research: bool = False
    refinement_query: Optional[str] = None
    enable_memory: bool = False


class MessageResponse(BaseModel):
    message_id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime
    metadata: dict = {}
