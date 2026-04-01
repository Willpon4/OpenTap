from typing import Optional, List
from uuid import UUID
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update
from sqlalchemy.orm import selectinload
from geoalchemy2.functions import ST_X, ST_Y
from app.models.report import Report
from app.models.supporting import StatusHistory
from app.models.fountain import Fountain
from app.services.fountain_service import create_fountain_from_report
from app.schemas.api import ReportCreate
import httpx
from app.core.sanitize import sanitize_text, sanitize_contact


async def create_report(db: AsyncSession, data: ReportCreate) -> Report:
    """Create a new report. Creates fountain if fountain_id is not provided."""
    fountain_id = data.fountain_id

    # If no fountain specified, create one from the report location
    if not fountain_id:
        fountain = await create_fountain_from_report(db, data.latitude, data.longitude)
        fountain_id = fountain.id
    else:
        # Update fountain status to reflect there's an issue
        await db.execute(
            update(Fountain)
            .where(Fountain.id == fountain_id)
            .values(status="issue", updated_at=datetime.now(timezone.utc))
        )

    # Sanitize inputs
    clean_description = sanitize_text(data.description) if data.description else None
    clean_contact = sanitize_contact(data.reporter_contact) if data.reporter_contact else None
    encrypted_contact = encrypt_contact(clean_contact) if clean_contact else None

    city = await reverse_geocode_city(data.latitude, data.longitude)

    report = Report(
        fountain_id=fountain_id,
        location=f"SRID=4326;POINT({data.longitude} {data.latitude})",
        issue_type=data.issue_type,
        severity=data.severity,
        description=clean_description,
        reporter_contact=encrypted_contact,
        reporter_channel=data.reporter_channel,
        city=city,
        status="reported",
        reported_at=datetime.now(timezone.utc),
        photo_url=data.photo_url,
    )
    db.add(report)
    await db.flush()

    # Record initial status
    history = StatusHistory(
        report_id=report.id,
        old_status=None,
        new_status="reported",
        notes="Report submitted by citizen",
    )
    db.add(history)
    await db.flush()

    return report

async def reverse_geocode_city(lat: float, lng: float) -> str:
    """Get city name from coordinates using OpenStreetMap Nominatim."""
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/reverse",
                params={"lat": lat, "lon": lng, "format": "json", "zoom": 10},
                headers={"User-Agent": "OpenTap/0.1"},
                timeout=5,
            )
            data = resp.json()
            address = data.get("address", {})
            city = address.get("city") or address.get("town") or address.get("village") or address.get("county", "")
            state = address.get("state", "")
            if city and state:
                return f"{city}, {state}"
            return city or "Unknown"
    except Exception:
        return "Unknown"

async def get_report_detail(db: AsyncSession, report_id: UUID) -> Optional[dict]:
    """Get a report with full status history and photos."""
    query = (
        select(
            Report,
            ST_X(Report.location).label("longitude"),
            ST_Y(Report.location).label("latitude"),
        )
        .options(selectinload(Report.status_history), selectinload(Report.photos))
        .where(Report.id == report_id)
    )
    result = await db.execute(query)
    row = result.first()
    if not row:
        return None

    report = row[0]
    return {
        "report": report,
        "longitude": row.longitude,
        "latitude": row.latitude,
    }


async def update_report_status(
    db: AsyncSession,
    report_id: UUID,
    new_status: str,
    changed_by: Optional[UUID] = None,
    notes: Optional[str] = None,
) -> Optional[Report]:
    """Update report status and record in history."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        return None

    old_status = report.status
    now = datetime.now(timezone.utc)

    # Valid transitions
    valid_transitions = {
        "reported": ["acknowledged", "stale"],
        "acknowledged": ["in_progress", "resolved", "stale"],
        "in_progress": ["resolved", "stale"],
        "resolved": ["reported"],  # reopen
        "stale": ["acknowledged", "in_progress", "resolved"],
    }
    if new_status not in valid_transitions.get(old_status, []):
        return None

    report.status = new_status

    # Set lifecycle timestamp
    timestamp_map = {
        "acknowledged": "acknowledged_at",
        "in_progress": "in_progress_at",
        "resolved": "resolved_at",
        "stale": "stale_at",
    }
    if new_status in timestamp_map:
        setattr(report, timestamp_map[new_status], now)

    # Update fountain status if resolved
    if new_status == "resolved" and report.fountain_id:
        # Check if there are other open reports for this fountain
        open_count = await db.execute(
            select(func.count(Report.id))
            .where(Report.fountain_id == report.fountain_id)
            .where(Report.id != report_id)
            .where(Report.status.in_(["reported", "acknowledged", "in_progress"]))
        )
        if open_count.scalar() == 0:
            await db.execute(
                update(Fountain)
                .where(Fountain.id == report.fountain_id)
                .values(status="working", last_verified=now, updated_at=now)
            )

    # Record history
    history = StatusHistory(
        report_id=report_id,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        notes=notes,
    )
    db.add(history)
    await db.flush()

    return report


async def escalate_stale_reports(db: AsyncSession, threshold_days: int = 14) -> int:
    """Move unacknowledged reports past the threshold to stale status."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=threshold_days)
    result = await db.execute(
        select(Report)
        .where(Report.status == "reported")
        .where(Report.reported_at < cutoff)
    )
    reports = result.scalars().all()
    count = 0
    for report in reports:
        await update_report_status(db, report.id, "stale", notes=f"Auto-escalated: no response after {threshold_days} days")
        count += 1
    return count


async def get_reports_for_city(
    db: AsyncSession,
    city_boundary_wkt: str,
    status: Optional[str] = None,
    severity: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
) -> List[dict]:
    """Get reports within a city's boundary polygon."""
    from geoalchemy2.functions import ST_Within
    from sqlalchemy import text as sa_text

    query = (
        select(
            Report,
            ST_X(Report.location).label("longitude"),
            ST_Y(Report.location).label("latitude"),
        )
        .where(ST_Within(Report.location, sa_text(f"ST_GeomFromText('{city_boundary_wkt}', 4326)")))
        .order_by(Report.reported_at.desc())
    )
    if status:
        query = query.where(Report.status == status)
    if severity:
        query = query.where(Report.severity == severity)
    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    rows = result.all()
    return [
        {"report": row[0], "longitude": row.longitude, "latitude": row.latitude}
        for row in rows
    ]
