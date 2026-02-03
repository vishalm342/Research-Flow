from datetime import datetime, timezone
from typing import List, Optional

from beanie import Document
from pydantic import Field


class ResearchSession(Document):
    session_id: str = Field(..., description="Unique session identifier", unique=True)
    topic: str = Field(..., description="Research topic")
    depth: str = Field(default="medium", description="Research depth")
    status: str = Field(default="pending", description="Current status of the research session")
    progress: int = Field(default=0, description="Progress percentage (0-100)")
    current_agent: Optional[str] = Field(default=None, description="Currently active agent")
    report_id: Optional[str] = Field(default=None, description="Generated report ID")
    error_message: Optional[str] = Field(default=None, description="Error message if failed")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "research_sessions"


class Report(Document):
    report_id: str = Field(..., description="Unique report identifier", unique=True)
    session_id: str = Field(..., description="Associated session ID")
    topic: str = Field(..., description="Research topic")
    content: str = Field(..., description="Full report content in markdown")
    sources: List[dict] = Field(default_factory=list, description="List of sources used")
    word_count: int = Field(..., description="Word count of the report")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "reports"
