# API endpoints for researcher agent interaction
from fastapi import APIRouter, BackgroundTasks, HTTPException
import uuid
from app.schemas.research import ResearchRequest, ResearchResponse, StatusResponse
from app.models.research import ResearchSession
from app.workflow.graph import run_research_workflow
from app.utils.logger import logger

router = APIRouter(prefix="/api", tags=["research"])


@router.post("/research", response_model=ResearchResponse)
async def create_research(
    request: ResearchRequest,
    background_tasks: BackgroundTasks
):
    """
    Create a new research session and start the workflow in the background.
    
    Args:
        request: ResearchRequest containing topic and depth
        background_tasks: FastAPI background tasks
        
    Returns:
        ResearchResponse with session_id, status, and message
    """
    try:
        # Generate unique session ID
        session_id = str(uuid.uuid4())
        
        logger.info(f"Creating research session for topic: {request.topic}")
        
        # Create ResearchSession in MongoDB
        session = ResearchSession(
            session_id=session_id,
            topic=request.topic,
            depth=request.depth,
            status="pending",
            progress=0,
            current_agent=None,
            error_message=None
        )
        await session.insert()
        
        logger.info(f"Research session created with ID: {session_id}")
        
        # Add background task to run the research workflow
        background_tasks.add_task(run_research_workflow, session_id)
        
        logger.info(f"Background task scheduled for session: {session_id}")
        
        return ResearchResponse(
            session_id=session_id,
            status="pending",
            message="Research workflow started successfully"
        )
        
    except Exception as e:
        error_msg = f"Failed to create research session: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)


@router.get("/status/{session_id}", response_model=StatusResponse)
async def get_research_status(session_id: str):
    """
    Get the current status of a research session.
    
    Args:
        session_id: The unique session identifier
        
    Returns:
        StatusResponse with current status, progress, and agent information
        
    Raises:
        HTTPException: 404 if session not found
    """
    try:
        logger.info(f"Fetching status for session: {session_id}")
        
        # Query ResearchSession by session_id
        session = await ResearchSession.find_one(ResearchSession.session_id == session_id)
        
        if not session:
            logger.warning(f"Session not found: {session_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Research session not found: {session_id}"
            )
        
        # Return status response
        return StatusResponse(
            session_id=session.session_id,
            status=session.status,
            progress=getattr(session, 'progress', 0),
            current_agent=getattr(session, 'current_agent', None),
            report_id=getattr(session, 'report_id', None),
            error_message=getattr(session, 'error_message', None)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Failed to fetch session status: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
