from typing import List
from app.agents.state import AgentState
from app.tools.web_search import search_web
from app.tools.scraper import scrape_url
from app.models.research import ResearchSession
from app.utils.logger import logger


async def researcher_node(state: AgentState) -> AgentState:
    """
    Researcher agent node - searches the web and scrapes relevant content.
    
    Args:
        state: Current AgentState with topic and session_id
        
    Returns:
        Updated AgentState with search_results and scraped_content
    """
    try:
        session_id = state["session_id"]
        topic = state["topic"]
        
        logger.info(f"Researcher node started for session {session_id}, topic: {topic}")
        
        # Update MongoDB session status to indicate researcher is running
        session = await ResearchSession.find_one(ResearchSession.session_id == session_id)
        if session:
            session.status = "researcher_running"
            session.progress = 10
            session.current_agent = "researcher"
            await session.save()
        
        # Search the web for the topic
        logger.info(f"Searching web for: {topic}")
        search_results = await search_web(topic, max_results=8)
        
        if not search_results:
            logger.warning(f"No search results found for topic: {topic}")
            state["search_results"] = []
            state["scraped_content"] = []
            state["current_step"] = "researcher_complete"
            return state
        
        logger.info(f"Found {len(search_results)} search results")
        
        # Get top 5 URLs to scrape
        urls = [r["url"] for r in search_results[:5]]
        logger.info(f"Scraping {len(urls)} URLs")
        
        # Scrape each URL concurrently
        scraped = []
        for url in urls:
            result = await scrape_url(url)
            scraped.append(result)
        
        # Filter successful scrapes
        scraped_content = [s for s in scraped if s.get("success")]
        logger.info(f"Successfully scraped {len(scraped_content)} out of {len(urls)} URLs")
        
        # Update MongoDB session with progress
        if session:
            session.status = "researcher_complete"
            session.progress = 33
            session.current_agent = "researcher"
            await session.save()
        
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