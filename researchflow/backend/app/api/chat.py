import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, HTTPException

from app.models.conversation import Conversation
from app.models.message import Message
from app.models.research import ResearchSession
from app.schemas.chat import (
    ConversationResponse,
    ConversationUpdateRequest,
    MessageRequest,
    MessageResponse,
)
from app.workflow.graph import run_research_workflow
from app.utils.logger import logger

router = APIRouter(prefix="/api", tags=["chat"])


# ---------------------------------------------------------------------------
# POST /conversations  –  create a new conversation
# ---------------------------------------------------------------------------

@router.post("/conversations", response_model=ConversationResponse, status_code=201)
async def create_conversation():
    """
    Create a new, empty conversation and return its metadata.
    """
    try:
        conversation = Conversation(
            conversation_id=str(uuid.uuid4()),
            user_session="anon",
            title="New Conversation",
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            message_count=0,
            status="active",
        )
        await conversation.insert()

        logger.info(f"Created conversation: {conversation.conversation_id}")

        return ConversationResponse(
            conversation_id=conversation.conversation_id,
            user_session=conversation.user_session,
            title=conversation.title,
            is_pinned=conversation.is_pinned,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            message_count=conversation.message_count,
            status=conversation.status,
        )

    except Exception as e:
        error_msg = f"Failed to create conversation: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


# ---------------------------------------------------------------------------
# GET /conversations/{id}/messages  –  list all messages
# ---------------------------------------------------------------------------

@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
async def get_messages(conversation_id: str):
    """
    Return all messages for a conversation, ordered by creation time.
    """
    try:
        # Verify the conversation exists
        conversation = await Conversation.find_one(
            Conversation.conversation_id == conversation_id
        )
        if not conversation:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation not found: {conversation_id}",
            )

        messages = (
            await Message.find(Message.conversation_id == conversation_id)
            .sort(+Message.created_at)
            .to_list()
        )

        return [
            MessageResponse(
                message_id=m.message_id,
                conversation_id=m.conversation_id,
                role=m.role,
                content=m.content,
                created_at=m.created_at,
                metadata=m.metadata,
            )
            for m in messages
        ]

    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Failed to fetch messages: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


# ---------------------------------------------------------------------------
# GET /conversations  –  list all conversations
# ---------------------------------------------------------------------------

@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations():
    """
    Return all conversations ordered by pinned status, then most recently updated.
    """
    try:
        conversations = (
            await Conversation.find()
            .sort(-Conversation.is_pinned, -Conversation.updated_at)
            .to_list()
        )

        return [
            ConversationResponse(
                conversation_id=c.conversation_id,
                user_session=c.user_session,
                title=c.title,
                is_pinned=c.is_pinned,
                created_at=c.created_at,
                updated_at=c.updated_at,
                message_count=c.message_count,
                status=c.status,
            )
            for c in conversations
        ]

    except Exception as e:
        error_msg = f"Failed to list conversations: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


# ---------------------------------------------------------------------------
# DELETE /conversations/cleanup/empty  –  remove empty conversations
# ---------------------------------------------------------------------------

@router.delete("/conversations/cleanup/empty")
async def cleanup_empty_conversations():
    """
    Delete all conversations with no messages and return the number deleted.
    """
    try:
        empty_conversations = await Conversation.find(
            Conversation.message_count == 0
        ).to_list()

        if not empty_conversations:
            return {"deleted_count": 0}

        conversation_ids = [conversation.conversation_id for conversation in empty_conversations]
        await Message.find(Message.conversation_id.in_(conversation_ids)).delete()

        for conversation in empty_conversations:
            await conversation.delete()

        return {"deleted_count": len(empty_conversations)}

    except Exception as e:
        error_msg = f"Failed to clean up empty conversations: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


# ---------------------------------------------------------------------------
# PATCH /conversations/{id}  –  update conversation metadata
# ---------------------------------------------------------------------------

@router.patch("/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    request: ConversationUpdateRequest,
):
    """
    Update conversation title and/or pinned state.
    """
    try:
        conversation = await Conversation.find_one(
            Conversation.conversation_id == conversation_id
        )
        if not conversation:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation not found: {conversation_id}",
            )

        updated = False

        if request.title is not None:
            conversation.title = request.title
            updated = True

        if request.is_pinned is not None:
            conversation.is_pinned = request.is_pinned
            updated = True

        if updated:
            conversation.updated_at = datetime.now(timezone.utc)
            await conversation.save()

        return ConversationResponse(
            conversation_id=conversation.conversation_id,
            user_session=conversation.user_session,
            title=conversation.title,
            is_pinned=conversation.is_pinned,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            message_count=conversation.message_count,
            status=conversation.status,
        )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Failed to update conversation: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


# ---------------------------------------------------------------------------
# DELETE /conversations/{id}  –  delete conversation and messages
# ---------------------------------------------------------------------------

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """
    Delete a conversation and all associated messages.
    """
    try:
        conversation = await Conversation.find_one(
            Conversation.conversation_id == conversation_id
        )
        if not conversation:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation not found: {conversation_id}",
            )

        await Message.find(Message.conversation_id == conversation_id).delete()
        await conversation.delete()

        return {"deleted": True, "conversation_id": conversation_id}

    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Failed to delete conversation: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


# ---------------------------------------------------------------------------
# POST /conversations/{id}/messages  –  send a message
# ---------------------------------------------------------------------------

@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=201,
)
async def send_message(
    conversation_id: str,
    request: MessageRequest,
    background_tasks: BackgroundTasks,
):
    """
    Accept a user message, persist it, and generate / schedule an assistant reply.

    * If ``trigger_research`` is True a full research workflow is started in
      the background and an immediate acknowledgement message is returned.
    * Otherwise the user message is stored and a simple echo/ack reply is
      returned (wire in an LLM call here later if you want a chat mode).
    """
    try:
        # ------------------------------------------------------------------
        # 1. Verify conversation exists
        # ------------------------------------------------------------------
        conversation = await Conversation.find_one(
            Conversation.conversation_id == conversation_id
        )
        if not conversation:
            raise HTTPException(
                status_code=404,
                detail=f"Conversation not found: {conversation_id}",
            )

        # ------------------------------------------------------------------
        # 2. Persist the user message
        # ------------------------------------------------------------------
        user_message = Message(
            message_id=str(uuid.uuid4()),
            conversation_id=conversation_id,
            role="user",
            content=request.content,
            created_at=datetime.now(timezone.utc),
            metadata={},
        )
        await user_message.insert()
        logger.info(
            f"Saved user message {user_message.message_id} "
            f"to conversation {conversation_id}"
        )

        # ------------------------------------------------------------------
        # 2.5. Auto-generate title from first user message
        # ------------------------------------------------------------------
        # Check if this is the first message by looking at the current count
        if conversation.message_count == 0:
            # Extract first 5 words for the title
            words = request.content.split()
            if len(words) > 5:
                new_title = ' '.join(words[:5]) + '...'
            else:
                new_title = request.content[:60]  # Fallback: first 60 chars
            
            conversation.title = new_title
            logger.info(f"Auto-generated title for conversation {conversation_id}: {new_title}")

        # Update conversation metadata
        conversation.message_count += 1
        conversation.updated_at = datetime.now(timezone.utc)
        await conversation.save()

        # ------------------------------------------------------------------
        # 3. Build the assistant reply
        # ------------------------------------------------------------------
        if request.trigger_research:
            # ---- Create a linked ResearchSession --------------------------
            session_id = str(uuid.uuid4())
            session = ResearchSession(
                session_id=session_id,
                topic=request.content,
                depth="medium",
                status="pending",
                progress=0,
                current_agent=None,
                error_message=None,
                refinement_query=request.refinement_query,
                memory_enabled=request.enable_memory,
            )
            # Store the conversation_id so the workflow can post results back
            await session.insert()

            # Persist the stub assistant message immediately
            assistant_message = Message(
                message_id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                role="assistant",
                content=(
                    "I am researching this now. Please wait… "
                    "I'll post the full report here once it's ready."
                ),
                created_at=datetime.now(timezone.utc),
                metadata={"research_id": session_id},
            )
            await assistant_message.insert()

            conversation.message_count += 1
            conversation.updated_at = datetime.now(timezone.utc)
            await conversation.save()

            # Kick off the workflow in the background
            background_tasks.add_task(
                run_research_workflow,
                session_id,
                conversation_id,   # pass so workflow can post the report back
            )

            logger.info(
                f"Research workflow scheduled: session={session_id}, "
                f"conversation={conversation_id}"
            )

        else:
            # ---- Plain acknowledgement (no research triggered) ------------
            reply_content = (
                request.refinement_query
                if request.refinement_query
                else "Got it! If you'd like me to research this topic, "
                     "please enable the research option."
            )
            assistant_message = Message(
                message_id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                role="assistant",
                content=reply_content,
                created_at=datetime.now(timezone.utc),
                metadata={},
            )
            await assistant_message.insert()

            conversation.message_count += 1
            conversation.updated_at = datetime.now(timezone.utc)
            await conversation.save()

        return MessageResponse(
            message_id=assistant_message.message_id,
            conversation_id=assistant_message.conversation_id,
            role=assistant_message.role,
            content=assistant_message.content,
            created_at=assistant_message.created_at,
            metadata=assistant_message.metadata,
        )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Failed to process message: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
