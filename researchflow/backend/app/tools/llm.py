import asyncio
from groq import Groq
from app.config import settings
from app.utils.logger import logger


class LLMError(Exception):
    """Custom exception for LLM-related errors"""
    pass


async def call_llm(prompt: str, model: str = "llama-3.3-70b-versatile") -> str:
    """
    Call Groq LLM API asynchronously.
    
    Args:
        prompt: The prompt to send to the LLM
        model: The model name to use (default: llama-3.3-70b-versatile)
        
    Returns:
        The generated text response from the LLM
        
    Raises:
        LLMError: If the API call fails
    """
    try:
        logger.info(f"Calling LLM with model: {model}")
        
        # Create Groq client
        client = Groq(api_key=settings.GROQ_API_KEY)
        
        # Call the API in a thread pool since Groq SDK is sync
        def _call_groq():
            completion = client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.7,
                max_tokens=2000
            )
            return completion.choices[0].message.content
        
        # Execute in thread pool
        response = await asyncio.to_thread(_call_groq)
        
        logger.info(f"LLM response received: {len(response)} characters")
        return response
        
    except Exception as e:
        error_msg = f"Failed to call LLM API: {str(e)}"
        logger.error(error_msg)
        raise LLMError(error_msg) from e


def get_llm():
    """
    Legacy function for compatibility.
    Use call_llm() for async operations.
    """
    return call_llm
