from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services import report_service
from app.schemas.api import ReportCreate, ReportDetail, ReportSummary

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("", response_model=ReportSummary, status_code=201)
async def create_report(
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
):
    """Submit a new report. Creates a fountain record if fountain_id is not provided."""
    report = await report_service.create_report(db, data)
    from geoalchemy2.functions import ST_X, ST_Y
    from sqlalchemy import select
    from app.models.report import Report

    result = await db.execute(
        select(ST_X(Report.location), ST_Y(Report.location))
        .where(Report.id == report.id)
    )
    coords = result.first()

    return ReportSummary(
        id=report.id,
        issue_type=report.issue_type,
        severity=report.severity,
        status=report.status,
        reporter_channel=report.reporter_channel,
        reported_at=report.reported_at,
        latitude=coords[1],
        longitude=coords[0],
    )


@router.get("/{report_id}")
async def get_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a report with full status history and photos."""
    data = await report_service.get_report_detail(db, report_id)
    if not data:
        raise HTTPException(404, "Report not found")

    report = data["report"]
    return ReportDetail(
        id=report.id,
        fountain_id=report.fountain_id,
        issue_type=report.issue_type,
        severity=report.severity,
        status=report.status,
        reporter_channel=report.reporter_channel,
        reported_at=report.reported_at,
        latitude=data["latitude"],
        longitude=data["longitude"],
        description=report.description,
        acknowledged_at=report.acknowledged_at,
        in_progress_at=report.in_progress_at,
        resolved_at=report.resolved_at,
        stale_at=report.stale_at,
        status_history=[
            {
                "old_status": h.old_status,
                "new_status": h.new_status,
                "notes": h.notes,
                "changed_at": h.changed_at,
            }
            for h in report.status_history
        ],
        photos=[
            {
                "id": p.id,
                "storage_url": p.storage_url,
                "thumbnail_url": p.thumbnail_url,
                "uploaded_at": p.uploaded_at,
            }
            for p in report.photos
        ],
    )
