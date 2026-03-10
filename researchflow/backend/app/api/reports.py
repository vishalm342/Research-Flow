# API endpoints for fetching reports
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from app.models.research import Report
from app.schemas.research import ReportResponse
from app.utils.logger import logger
import markdown
import weasyprint

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


@router.get("/reports/{report_id}/export")
async def export_report(report_id: str, format: str = "pdf"):
    """
    Export a research report as PDF or Markdown.

    Args:
        report_id: The unique report identifier
        format: Export format - 'pdf' or 'markdown' (default: 'pdf')

    Returns:
        File download response with appropriate content type

    Raises:
        HTTPException: 404 if report not found, 400 for invalid format
    """
    try:
        logger.info(f"Exporting report {report_id} as {format}")

        # Fetch the report
        report = await Report.find_one(Report.report_id == report_id)

        if not report:
            logger.warning(f"Report not found for export: {report_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Report not found: {report_id}",
            )

        # Export as Markdown
        if format == "markdown":
            return Response(
                content=report.content,
                media_type="text/markdown",
                headers={
                    "Content-Disposition": f'attachment; filename="report-{report_id}.md"'
                },
            )

        # Export as PDF
        elif format == "pdf":
            # Convert markdown to HTML
            html_content = markdown.markdown(
                report.content,
                extensions=['tables', 'fenced_code', 'nl2br']
            )

            # Wrap in styled HTML
            styled_html = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>{report.topic}</title>
                <style>
                    @page {{
                        size: A4;
                        margin: 2cm;
                    }}
                    body {{
                        font-family: 'Helvetica', 'Arial', sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 800px;
                        margin: 0 auto;
                    }}
                    h1 {{
                        color: #1a1a1a;
                        font-size: 28px;
                        margin-top: 0;
                        margin-bottom: 24px;
                        padding-bottom: 12px;
                        border-bottom: 3px solid #4f46e5;
                    }}
                    h2 {{
                        color: #2d2d2d;
                        font-size: 22px;
                        margin-top: 32px;
                        margin-bottom: 16px;
                        border-bottom: 2px solid #e5e7eb;
                        padding-bottom: 8px;
                    }}
                    h3 {{
                        color: #404040;
                        font-size: 18px;
                        margin-top: 24px;
                        margin-bottom: 12px;
                    }}
                    p {{
                        margin-bottom: 16px;
                        text-align: justify;
                    }}
                    code {{
                        background-color: #f3f4f6;
                        padding: 2px 6px;
                        border-radius: 4px;
                        font-family: 'Courier New', monospace;
                        font-size: 13px;
                        color: #7c3aed;
                    }}
                    pre {{
                        background-color: #1f2937;
                        color: #e5e7eb;
                        padding: 16px;
                        border-radius: 8px;
                        overflow-x: auto;
                        margin: 20px 0;
                    }}
                    pre code {{
                        background-color: transparent;
                        color: inherit;
                        padding: 0;
                    }}
                    blockquote {{
                        border-left: 4px solid #4f46e5;
                        padding-left: 20px;
                        margin-left: 0;
                        color: #666;
                        font-style: italic;
                        background-color: #f9fafb;
                        padding: 12px 20px;
                        border-radius: 0 8px 8px 0;
                    }}
                    ul, ol {{
                        margin-bottom: 16px;
                        padding-left: 28px;
                    }}
                    li {{
                        margin-bottom: 8px;
                    }}
                    table {{
                        border-collapse: collapse;
                        width: 100%;
                        margin: 20px 0;
                    }}
                    th, td {{
                        border: 1px solid #e5e7eb;
                        padding: 10px;
                        text-align: left;
                    }}
                    th {{
                        background-color: #4f46e5;
                        color: white;
                        font-weight: bold;
                    }}
                    tr:nth-child(even) {{
                        background-color: #f9fafb;
                    }}
                    a {{
                        color: #4f46e5;
                        text-decoration: none;
                    }}
                    a:hover {{
                        text-decoration: underline;
                    }}
                    hr {{
                        border: none;
                        border-top: 2px solid #e5e7eb;
                        margin: 32px 0;
                    }}
                    .footer {{
                        margin-top: 48px;
                        padding-top: 16px;
                        border-top: 1px solid #e5e7eb;
                        font-size: 12px;
                        color: #6b7280;
                        text-align: center;
                    }}
                </style>
            </head>
            <body>
                <h1>{report.topic}</h1>
                {html_content}
                <div class="footer">
                    Generated by ResearchFlow | Word Count: {report.word_count} | {report.created_at.strftime('%B %d, %Y')}
                </div>
            </body>
            </html>
            """

            # Generate PDF
            pdf_bytes = weasyprint.HTML(string=styled_html).write_pdf()

            return Response(
                content=pdf_bytes,
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="report-{report_id}.pdf"'
                },
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid format: {format}. Use 'pdf' or 'markdown'.",
            )

    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Failed to export report: {str(e)}"
        logger.error(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)
