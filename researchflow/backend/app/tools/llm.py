import asyncio

from openai import AsyncOpenAI
from openai import RateLimitError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings
from app.utils.logger import logger


class LLMError(Exception):
    """Custom exception for LLM-related errors"""
    pass


_client = AsyncOpenAI(
    api_key=settings.SAMBANOVA_API_KEY,
    base_url="https://api.sambanova.ai/v1",
)

_llm_semaphore = asyncio.Semaphore(3)


@retry(
    retry=retry_if_exception_type(RateLimitError),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    stop=stop_after_attempt(5),
    reraise=True,
)
async def _call_with_retry(model: str, prompt: str):
    async with _llm_semaphore:
        return await _client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            temperature=0.7,
            max_tokens=2000,
        )


async def call_llm(prompt: str, model: str = "Meta-Llama-3.3-70B-Instruct") -> str:
    """
    Call SambaNova LLM API asynchronously via the OpenAI-compatible interface.

    Args:
        prompt: The prompt to send to the LLM
        model: The model name to use (default: Meta-Llama-3.3-70B-Instruct)

    Returns:
        The generated text response from the LLM

    Raises:
        LLMError: If the API call fails
    """
    try:
        logger.info(f"Calling LLM with model: {model}")

        completion = await _call_with_retry(model, prompt)

        response = completion.choices[0].message.content
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
