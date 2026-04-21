from app.agents.state import AgentState
from app.tools.llm import call_llm
from app.models.research import ResearchSession
from app.utils.logger import logger


async def writer_node(state: AgentState) -> AgentState:
    """
    Writer agent node - generates a comprehensive research report from scraped content.
    
    Note: Status updates are now handled by the workflow orchestration layer
    to ensure strict sequential ordering of status events.
    """
    try:
        session_id = state["session_id"]
        topic = state["topic"]
        scraped_content = state["scraped_content"]

        logger.info(f"Writer node started for session {session_id}, topic: {topic}")

        if not scraped_content:
            logger.warning(f"No scraped content available for topic: {topic}")
            context = "No content available."
        else:
            context_parts = []
            for idx, content in enumerate(scraped_content, 1):
                source_text = f"\n--- Source {idx}: {content.get('title', 'Untitled')} ---\n"
                source_text += f"URL: {content.get('url', 'N/A')}\n"
                source_text += f"{content.get('content', '')}\n"
                context_parts.append(source_text)
            context = "\n".join(context_parts)

        logger.info(f"Built context from {len(scraped_content)} sources, {len(context)} characters")

        prompt = f"""You are a research analyst. Write a comprehensive report of minimum 1200 words on '{topic}'. Use the following sources:

{context}

Format the report in markdown with the following required sections:

# {topic}

## Introduction

## Background

## Key Findings
(at least 5 distinct findings with detailed explanations)

## Detailed Analysis

## Implications

## Conclusion

IMPORTANT INSTRUCTIONS:
- Write a comprehensive report of minimum 1200 words
- Include an Introduction, Background, Key Findings (at least 5 distinct findings), Detailed Analysis, Implications, and Conclusion section
- Do not truncate or summarize — write in full depth for each section
- Cite sources naturally in text using the source URLs provided"""

        logger.info("Calling LLM to generate draft report")
        response = await call_llm(prompt)
        logger.info(f"Draft report generated: {len(response)} characters")

        state["draft_report"] = response
        state["current_step"] = "writer_complete"
        state["error"] = None

        logger.info(f"Writer node completed for session {session_id}")
        return state

    except Exception as e:
        error_msg = f"Writer node failed: {str(e)}"
        logger.error(error_msg)

        state["error"] = error_msg
        state["current_step"] = "writer_failed"

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
