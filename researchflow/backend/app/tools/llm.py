from openai import AsyncOpenAI
from app.config import settings
from app.utils.logger import logger


class LLMError(Exception):
    """Custom exception for LLM-related errors"""
    pass


_client = AsyncOpenAI(
    api_key=settings.SAMBANOVA_API_KEY,
    base_url="https://api.sambanova.ai/v1",
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

        completion = await _client.chat.completions.create(
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
