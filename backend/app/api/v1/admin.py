from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone, timedelta
from app.core.database import get_db
from app.core.auth import (
    hash_password, verify_password, create_access_token,
    get_current_admin, verify_internal_api_key,
)
from app.models.supporting import AdminUser, CityBoundary, StatusHistory
from app.models.report import Report
from app.models.fountain import Fountain
from app.services import report_service
from app.schemas.api import (
    AdminLogin, AdminLoginResponse, AdminDashboardStats,
    ReportStatusUpdate, ReportSummary,
)
from app.core.config import get_settings
from fastapi import Request

router = APIRouter(prefix="/admin", tags=["admin"])
settings = get_settings()


@router.post("/auth/login", response_model=AdminLoginResponse)
async def login(data: AdminLogin, db: AsyncSession = Depends(get_db)):
    
    result = await db.execute(select(AdminUser).where(AdminUser.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(401, "Invalid email or password")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return AdminLoginResponse(
        access_token=token,
        user_id=user.id,
        name=user.name,
        role=user.role,
    )


@router.get("/dashboard", response_model=AdminDashboardStats)
async def dashboard_stats(
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Get summary stats for admin's jurisdiction."""
    now = datetime.now(timezone.utc)
    month_ago = now - timedelta(days=30)

    # Base queries scoped to admin's city if they have one
    fountain_query = select(func.count(Fountain.id))
    report_query = select(func.count(Report.id))

    if admin.city_id:
        city_result = await db.execute(
            select(CityBoundary.boundary).where(CityBoundary.id == admin.city_id)
        )
        boundary = city_result.scalar_one_or_none()
        if boundary:
            from geoalchemy2.functions import ST_Within
            fountain_query = fountain_query.where(ST_Within(Fountain.location, boundary))
            report_query = report_query.where(ST_Within(Report.location, boundary))

    total_fountains = (await db.execute(fountain_query)).scalar() or 0
    total_reports = (await db.execute(report_query)).scalar() or 0

    open_reports = (await db.execute(
        report_query.where(Report.status.in_(["reported", "acknowledged", "in_progress"]))
    )).scalar() or 0

    resolved_reports = (await db.execute(
        report_query.where(Report.status == "resolved")
    )).scalar() or 0

    stale_reports = (await db.execute(
        report_query.where(Report.status == "stale")
    )).scalar() or 0

    reports_this_month = (await db.execute(
        report_query.where(Report.reported_at >= month_ago)
    )).scalar() or 0

    # Average resolution time for resolved reports
    avg_query = select(
        func.avg(
            func.extract("epoch", Report.resolved_at - Report.reported_at) / 3600
        )
    ).where(Report.status == "resolved").where(Report.resolved_at.isnot(None))
    avg_hours = (await db.execute(avg_query)).scalar()

    return AdminDashboardStats(
        total_fountains=total_fountains,
        total_reports=total_reports,
        open_reports=open_reports,
        resolved_reports=resolved_reports,
        stale_reports=stale_reports,
        avg_resolution_hours=round(avg_hours, 1) if avg_hours else None,
        reports_this_month=reports_this_month,
    )


@router.get("/reports", response_model=list[ReportSummary])
async def list_admin_reports(
    status: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    issue_type: Optional[str] = Query(None),
    limit: int = Query(100, le=1000),
    offset: int = Query(0),
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """List reports in admin's jurisdiction."""
    from geoalchemy2.functions import ST_X, ST_Y

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

    # Scope to admin's city
    if admin.city_id:
        city_result = await db.execute(
            select(CityBoundary.boundary).where(CityBoundary.id == admin.city_id)
        )
        boundary = city_result.scalar_one_or_none()
        if boundary:
            from geoalchemy2.functions import ST_Within
            query = query.where(ST_Within(Report.location, boundary))

    query = query.limit(limit).offset(offset)
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


@router.patch("/reports/{report_id}/status")
async def update_status(
    report_id: UUID,
    data: ReportStatusUpdate,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update a report's status (triggers notification to reporter)."""
    report = await report_service.update_report_status(
        db, report_id, data.status, changed_by=admin.id, notes=data.notes
    )
    if not report:
        raise HTTPException(404, "Report not found or invalid status transition")

    # Send email notification to reporter
    from app.services.notification_service import send_notification
    await send_notification(report.reporter_contact, data.status, str(report.id))

    return {"status": report.status, "updated": True}


@router.delete("/reports/{report_id}")
async def delete_report(
    report_id: UUID,
    admin: AdminUser = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    """Remove a spam or false report."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(404, "Report not found")
    await db.delete(report)
    return {"deleted": True}


# === Internal endpoints (cron jobs) ===

internal_router = APIRouter(prefix="/internal", tags=["internal"])


@internal_router.post("/escalate")
async def escalate_stale(
    x_api_key: str = Header(...),
    db: AsyncSession = Depends(get_db),
):
    """Cron job: escalate unacknowledged reports to stale."""
    if not verify_internal_api_key(x_api_key):
        raise HTTPException(403, "Invalid API key")
    count = await report_service.escalate_stale_reports(db, settings.STALE_THRESHOLD_DAYS)
    return {"escalated": count}
