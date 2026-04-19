from typing import List
from app.agents.state import AgentState
from app.tools.web_search import search_web
from app.tools.scraper import scrape_url
from app.models.research import ResearchSession
from app.utils.logger import logger


async def researcher_node(state: AgentState) -> AgentState:
    """
    Researcher agent node - searches the web and scrapes relevant content.
    
    Note: Status updates are now handled by the workflow orchestration layer
    to ensure strict sequential ordering of status events.
    
    Args:
        state: Current AgentState with topic and session_id
        
    Returns:
        Updated AgentState with search_results and scraped_content
    """
    try:
        session_id = state["session_id"]
        topic = state["topic"]
        
        logger.info(f"Researcher node started for session {session_id}, topic: {topic}")
        
        # Run TWO search queries: original + latest developments
        logger.info(f"Searching web for: {topic}")
        search_results_1 = await search_web(topic, max_results=8)
        
        logger.info(f"Searching web for: {topic} latest developments 2024 2025")
        search_results_2 = await search_web(f"{topic} latest developments 2024 2025", max_results=8)
        
        # Combine and deduplicate results by URL
        seen_urls = set()
        combined_results = []
        
        for result in search_results_1 + search_results_2:
            url = result.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                combined_results.append(result)
        
        search_results = combined_results
        
        if not search_results:
            logger.warning(f"No search results found for topic: {topic}")
            state["search_results"] = []
            state["scraped_content"] = []
            state["current_step"] = "researcher_complete"
            return state
        
        logger.info(f"Found {len(search_results)} deduplicated search results")
        
        # Get top 7 URLs to scrape
        urls = [r["url"] for r in search_results[:7]]
        logger.info(f"Scraping {len(urls)} URLs")
        
        # Scrape each URL concurrently
        scraped = []
        for url in urls:
            result = await scrape_url(url)
            scraped.append(result)
        
        # Filter successful scrapes
        scraped_content = [s for s in scraped if s.get("success")]
        logger.info(f"Successfully scraped {len(scraped_content)} out of {len(urls)} URLs")
        
        # Update state
        state["search_results"] = search_results
        state["scraped_content"] = scraped_content
        state["current_step"] = "researcher_complete"
        state["error"] = None
        
        logger.info(f"Researcher node completed for session {session_id}")
        return state
        
    except Exception as e:
        error_msg = f"Researcher node failed: {str(e)}"
        logger.error(error_msg)
        
        # Update state with error
        state["error"] = error_msg
        state["current_step"] = "researcher_failed"
        
        # Update MongoDB session status to failed
        try:
            session_id = state.get("session_id")
            if session_id:
                session = await ResearchSession.find_one(ResearchSession.session_id == session_id)
                if session:
                    session.status = "failed"
                    session.error_message = error_msg
                    await session.save()
        except Exception as db_error:
            logger.error(f"Failed to update session status in DB: {db_error}")
        
        return state
