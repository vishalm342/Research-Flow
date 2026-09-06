import asyncio

from openai import AsyncOpenAI, RateLimitError
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.config import settings
from app.utils.logger import logger


class LLMError(Exception):
    """Custom exception for LLM-related errors."""
    pass


# Groq OpenAI-compatible client
_client = AsyncOpenAI(
    api_key=settings.GROQ_API_KEY,
    base_url="https://api.groq.com/openai/v1",
)

# Limit concurrent LLM calls to avoid rate spikes
_llm_semaphore = asyncio.Semaphore(3)


def _is_non_retryable_prompt_error(exc: Exception) -> bool:
    """
    Detect prompt errors that won't succeed on retry, such as 'request too
    large' or 'context length'. For these we fail fast rather than looping.
    """
    msg = str(exc).lower()
    return (
        "request too large" in msg
        or "tokens per minute" in msg
        or "rate_limit_exceeded" in msg
        or "context length" in msg
        or "prompt too long" in msg
    )


@retry(
    retry=retry_if_exception_type(RateLimitError),
    wait=wait_exponential(multiplier=1, min=2, max=30),
    stop=stop_after_attempt(3),
    reraise=True,
)
async def _call_with_retry(model: str, prompt: str):
    async with _llm_semaphore:
        try:
            return await _client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                temperature=0.7,
                # Conservative max_tokens to stay within free-tier TPM limits.
                max_tokens=512,
            )
        except Exception as exc:
            # Groq TPM/RPM limit errors are raised as RateLimitError whose
            # message contains "tokens per minute"/"rate_limit_exceeded" --
            # let tenacity retry those instead of failing fast.
            if isinstance(exc, RateLimitError):
                raise
            if _is_non_retryable_prompt_error(exc):
                # Prompt/token issue: don't retry, surface directly.
                raise LLMError(str(exc)) from exc
            raise


async def call_llm(prompt: str, model: str | None = None) -> str:
    """
    Call the LLM API asynchronously via the OpenAI-compatible Groq interface.

    Args:
        prompt: The prompt to send to the LLM.
        model: Optional model override. Defaults to configured LLM model.

    Returns:
        The generated text response from the LLM.

    Raises:
        LLMError: If the API call fails.
    """
    effective_model = model or settings.LLM_MODEL
    try:
        logger.info(f"Calling LLM with model: {effective_model}")

        completion = await _call_with_retry(effective_model, prompt)

        response = completion.choices[0].message.content or ""
        logger.info(f"LLM response received: {len(response)} characters")
        return response

    except LLMError as e:
        error_msg = f"Failed to call LLM API: {str(e)}"
        logger.error(error_msg)
        raise

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