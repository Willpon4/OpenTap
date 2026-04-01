from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services import report_service
from app.schemas.api import ReportCreate, ReportDetail, ReportSummary
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import Request
from fastapi import UploadFile, File, HTTPException

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

@router.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...)):
    """Upload a photo and store it in R2."""
    from app.services.storage_service import upload_file_to_r2

    allowed_types = ["image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, and WebP images are allowed.")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum 5MB.")

    result = upload_file_to_r2(contents, file.content_type)
    return result

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

@router.get("")
async def list_reports(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    issue_type: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    """List all reports, publicly visible."""
    from geoalchemy2.functions import ST_X, ST_Y
    from app.models.report import Report

    query = (
        select(
            Report,
            ST_X(Report.location).label("longitude"),
            ST_Y(Report.location).label("latitude"),
        )
        .order_by(Report.reported_at.desc())
    )
    if status:
        query = query.where(Report.status == status)
    if severity:
        query = query.where(Report.severity == severity)
    if issue_type:
        query = query.where(Report.issue_type == issue_type)
    query = query.limit(limit).offset(offset)
    if city:
        query = query.where(Report.city.ilike(f"%{city}%"))

    result = await db.execute(query)
    rows = result.all()

    return [
        ReportSummary(
            id=row[0].id,
            issue_type=row[0].issue_type,
            severity=row[0].severity,
            status=row[0].status,
            reporter_channel=row[0].reporter_channel,
            reported_at=row[0].reported_at,
            latitude=row.latitude,
            longitude=row.longitude,
        )
        for row in rows
    ]


