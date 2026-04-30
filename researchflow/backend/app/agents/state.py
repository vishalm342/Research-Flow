from typing import TypedDict, List, Optional, Annotated
from langgraph.graph import add_messages

def combine_lists(left, right):
    """Custom merge function for lists - append right to left."""
    return left + right if left else right

class AgentState(TypedDict):
    """
    State container for the research workflow.
    Tracks all data and progress throughout the multi-agent pipeline.
    
    IMPORTANT: Fields that are updated by parallel nodes must use Annotated
    with a reducer function to handle concurrent updates.
    """
    session_id: str  # Immutable - only set once in initial state
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
    research_errors: Annotated[List[str], combine_lists]  # Can be updated by parallel nodes
    messages: List[dict]
    memory_enabled: bool
    memory: List[dict]
