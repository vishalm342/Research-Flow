import asyncio
from app.agents.state import AgentState
from app.agents.context import add_agent_message, append_memory_entry
from app.tools.web_search import search_web
from app.tools.scraper import scrape_url
from app.models.research import ResearchSession
from app.utils.logger import logger


async def _run_research_query(query: str, max_results: int = 8, max_urls: int = 7) -> dict:
    logger.info(f"Searching web for: {query}")
    search_results = await search_web(query, max_results=max_results)

    if not search_results:
        return {"search_results": [], "scraped_content": []}

    urls = [r["url"] for r in search_results if r.get("url")][:max_urls]
    logger.info(f"Scraping {len(urls)} URLs for query: {query}")
    scraped = await asyncio.gather(*[scrape_url(url) for url in urls])
    scraped_content = [s for s in scraped if s.get("success")]
    return {"search_results": search_results, "scraped_content": scraped_content}


async def researcher_primary_node(state: AgentState) -> AgentState:
    """
    Primary researcher branch - searches the web and scrapes relevant content.
    """
    try:
        session_id = state["session_id"]
        topic = state["topic"]
        logger.info(f"Primary researcher started for session {session_id}, topic: {topic}")

        results = await _run_research_query(topic)
        state["search_results_primary"] = results["search_results"]
        state["scraped_content_primary"] = results["scraped_content"]

        add_agent_message(
            state,
            "researcher_primary",
            f"Collected {len(results['search_results'])} results for main query.",
            {"query": topic, "sources": len(results["scraped_content"])},
        )
        await append_memory_entry(
            state,
            "researcher_primary",
            f"Collected {len(results['search_results'])} results for main query.",
            {"query": topic, "sources": len(results["scraped_content"])},
        )
        return state

    except Exception as e:
        error_msg = f"Primary researcher failed: {str(e)}"
        logger.error(error_msg)
        state["research_errors"] = list(state.get("research_errors", [])) + [error_msg]
        return state


async def researcher_trends_node(state: AgentState) -> AgentState:
    """
    Secondary researcher branch for recent developments.
    """
    try:
        session_id = state["session_id"]
        topic = state["topic"]
        query = f"{topic} latest developments 2024 2025"
        logger.info(f"Trends researcher started for session {session_id}, query: {query}")

        results = await _run_research_query(query)
        state["search_results_secondary"] = results["search_results"]
        state["scraped_content_secondary"] = results["scraped_content"]

        add_agent_message(
            state,
            "researcher_trends",
            f"Collected {len(results['search_results'])} results for trends query.",
            {"query": query, "sources": len(results["scraped_content"])},
        )
        await append_memory_entry(
            state,
            "researcher_trends",
            f"Collected {len(results['search_results'])} results for trends query.",
            {"query": query, "sources": len(results["scraped_content"])},
        )
        return state

    except Exception as e:
        error_msg = f"Trends researcher failed: {str(e)}"
        logger.error(error_msg)
        state["research_errors"] = list(state.get("research_errors", [])) + [error_msg]
        return state


async def research_merge_node(state: AgentState) -> AgentState:
    """
    Merge node for parallel research branches.
    """
    try:
        session_id = state["session_id"]
        logger.info(f"Merging research results for session {session_id}")

        primary_results = state.get("search_results_primary", [])
        secondary_results = state.get("search_results_secondary", [])
        primary_scraped = state.get("scraped_content_primary", [])
        secondary_scraped = state.get("scraped_content_secondary", [])

        seen_urls = set()
        combined_results = []
        for result in primary_results + secondary_results:
            url = result.get("url")
            if url and url not in seen_urls:
                seen_urls.add(url)
                combined_results.append(result)

        combined_scraped = []
        seen_scraped = set()
        for item in primary_scraped + secondary_scraped:
            url = item.get("url")
            if url and url not in seen_scraped:
                seen_scraped.add(url)
                combined_scraped.append(item)

        state["search_results"] = combined_results
        state["scraped_content"] = combined_scraped
        state["current_step"] = "researcher_complete"
        if combined_results:
            state["error"] = None

        add_agent_message(
            state,
            "research_merge",
            f"Merged {len(combined_results)} unique results from parallel research.",
            {"sources": len(combined_scraped)},
        )
        await append_memory_entry(
            state,
            "research_merge",
            f"Merged {len(combined_results)} unique results from parallel research.",
            {"sources": len(combined_scraped)},
        )
        return state

    except Exception as e:
        error_msg = f"Research merge failed: {str(e)}"
        logger.error(error_msg)
        state["error"] = error_msg
        state["current_step"] = "researcher_failed"

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
