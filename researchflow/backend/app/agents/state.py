from typing import TypedDict, List, Optional


class AgentState(TypedDict):
    """
    State container for the research workflow.
    Tracks all data and progress throughout the multi-agent pipeline.
    """
    session_id: str
    topic: str
    depth: str
    search_results: List[dict]
    scraped_content: List[dict]
    draft_report: str
    final_report: str
    sources: List[dict]
    current_step: str
    retry_count: int
    error: Optional[str]