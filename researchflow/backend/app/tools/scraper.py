import httpx
from bs4 import BeautifulSoup
from app.utils.logger import logger


async def scrape_url(url: str) -> dict:
    """
    Scrape content from a URL and extract clean text.
    
    Args:
        url: The URL to scrape
        
    Returns:
        Dictionary containing url, title, content, and success status
    """
    try:
        logger.info(f"Scraping URL: {url}")
        
        # Fetch the URL with timeout
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, follow_redirects=True)
            response.raise_for_status()
            html = response.text
        
        # Parse HTML with BeautifulSoup
        soup = BeautifulSoup(html, 'html.parser')
        
        # Remove unwanted tags
        for tag in soup.find_all(['script', 'style', 'nav', 'footer', 'aside']):
            tag.decompose()
        
        # Extract title
        title_tag = soup.find('title')
        title = title_tag.get_text(strip=True) if title_tag else "No title"
        
        # Extract body text
        body_text = soup.get_text(separator=' ', strip=True)
        
        # Clean text: remove extra whitespace
        content = ' '.join(body_text.split())
        
        # Limit to 5000 characters
        if len(content) > 5000:
            content = content[:5000] + "..."
        
        logger.info(f"Successfully scraped {url} - {len(content)} characters")
        
        return {
            "url": url,
            "title": title,
            "content": content,
            "success": True
        }
        
    except httpx.TimeoutException as e:
        logger.error(f"Timeout while scraping {url}: {e}")
        return {
            "url": url,
            "success": False,
            "error": f"Timeout: {str(e)}"
        }
        
    except httpx.ConnectError as e:
        logger.error(f"Connection error while scraping {url}: {e}")
        return {
            "url": url,
            "success": False,
            "error": f"Connection error: {str(e)}"
        }
        
    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error while scraping {url}: {e}")
        return {
            "url": url,
            "success": False,
            "error": f"HTTP {e.response.status_code}: {str(e)}"
        }
        
    except Exception as e:
        logger.error(f"Unexpected error while scraping {url}: {e}")
        return {
            "url": url,
            "success": False,
            "error": str(e)
        }
