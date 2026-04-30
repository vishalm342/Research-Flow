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
    refinement_query: Optional[str]
    draft_quality_score: Optional[float]
    critic_decision: Optional[str]
    critic_feedback: Optional[str]
    router_decision: Optional[str]
    search_results_primary: List[dict]
    search_results_secondary: List[dict]
    scraped_content_primary: List[dict]
    scraped_content_secondary: List[dict]
    research_errors: List[str]
    messages: List[dict]
    memory_enabled: bool
    memory: List[dict]

    
