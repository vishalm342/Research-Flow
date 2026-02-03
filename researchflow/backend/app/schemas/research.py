from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ResearchRequest(BaseModel):
    topic: str
    depth: str = "medium"


class ResearchResponse(BaseModel):
    session_id: str
    status: str
    message: str


class StatusResponse(BaseModel):
    session_id: str
    status: str
    progress: int
    current_agent: Optional[str] = None
    report_id: Optional[str] = None
    error_message: Optional[str] = None


class SourceDict(BaseModel):
    url: str
    title: str
    snippet: str


class ReportResponse(BaseModel):
    report_id: str
    session_id: str
    topic: str
    content: str
    sources: List[SourceDict]
    word_count: int
    created_at: datetime
