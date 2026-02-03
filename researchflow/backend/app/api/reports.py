# API endpoints for fetching reports
from fastapi import APIRouter, HTTPException
from app.models.research import Report
from app.schemas.research import ReportResponse
from app.utils.logger import logger

router = APIRouter(prefix="/api", tags=["reports"])


@router.get("/report/{report_id}", response_model=ReportResponse)
async def get_report(report_id: str):
    """
    Get a completed research report by its ID.

    Args:
        report_id: The unique report identifier

    Returns:
        ReportResponse with full report content and metadata

    Raises:
        HTTPException: 404 if report not found
    """
    try:
        logger.info(f"Fetching report: {report_id}")

        # Query Report by report_id
        report = await Report.find_one(Report.report_id == report_id)

        if not report:
            logger.warning(f"Report not found: {report_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Report not found: {report_id}",
            )

        # Return report response
        return ReportResponse(
            report_id=report.report_id,
            session_id=report.session_id,
            topic=report.topic,
            content=report.content,
            sources=report.sources,
            word_count=report.word_count,
            created_at=report.created_at,
        )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Failed to fetch report: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
