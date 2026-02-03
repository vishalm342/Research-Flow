from typing import List
from tavily import TavilyClient
from duckduckgo_search import DDGS
from app.config import settings
from app.utils.logger import logger


async def search_web(query: str, max_results: int = 10) -> List[dict]:
    """
    Search the web using Tavily API with DuckDuckGo as fallback.
    
    Args:
        query: Search query string
        max_results: Maximum number of results to return
        
    Returns:
        List of search result dictionaries with url, title, snippet, and source
    """
    
    # Try Tavily API first
    try:
        if settings.TAVILY_API_KEY:
            logger.info(f"Searching with Tavily: {query}")
            client = TavilyClient(api_key=settings.TAVILY_API_KEY)
            response = client.search(query, max_results=max_results)
            
            results = []
            for result in response.get("results", []):
                results.append({
                    "url": result.get("url", ""),
                    "title": result.get("title", ""),
                    "snippet": result.get("content", ""),
                    "source": "tavily"
                })
            
            if results:
                logger.info(f"Found {len(results)} results from Tavily")
                return results
            else:
                logger.warning("Tavily returned no results, falling back to DuckDuckGo")
        else:
            logger.warning("TAVILY_API_KEY not set, using DuckDuckGo fallback")
            
    except Exception as e:
        logger.error(f"Tavily search failed: {e}, falling back to DuckDuckGo")
    
    # Fallback to DuckDuckGo
    try:
        logger.info(f"Searching with DuckDuckGo: {query}")
        ddgs = DDGS()
        ddgs_results = ddgs.text(query, max_results=max_results)
        
        results = []
        for result in ddgs_results:
            results.append({
                "url": result.get("href", result.get("link", "")),
                "title": result.get("title", ""),
                "snippet": result.get("body", result.get("snippet", "")),
                "source": "duckduckgo"
            })
        
        logger.info(f"Found {len(results)} results from DuckDuckGo")
        return results
        
    except Exception as e:
        logger.error(f"DuckDuckGo search failed: {e}")
        return []
