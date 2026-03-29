from typing import Optional, List
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from geoalchemy2.functions import ST_DWithin, ST_MakePoint, ST_SetSRID, ST_MakeEnvelope, ST_X, ST_Y
from app.models.fountain import Fountain
from app.models.report import Report


async def get_fountains_bbox(
    db: AsyncSession,
    min_lng: float, min_lat: float, max_lng: float, max_lat: float,
    status: Optional[str] = None,
    limit: int = 500,
    offset: int = 0,
) -> List[dict]:
    """Get fountains within a bounding box."""
    envelope = ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    query = (
        select(
            Fountain.id,
            ST_X(Fountain.location).label("longitude"),
            ST_Y(Fountain.location).label("latitude"),
            Fountain.source,
            Fountain.type,
            Fountain.status,
            Fountain.last_verified,
            Fountain.created_at,
            func.count(Report.id).label("report_count"),
        )
        .outerjoin(Report, Report.fountain_id == Fountain.id)
        .where(Fountain.location.ST_Within(envelope))
        .group_by(Fountain.id)
    )
    if status:
        query = query.where(Fountain.status == status)
    query = query.limit(limit).offset(offset)

    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "id": row.id,
            "longitude": row.longitude,
            "latitude": row.latitude,
            "source": row.source,
            "type": row.type,
            "status": row.status,
            "last_verified": row.last_verified,
            "created_at": row.created_at,
            "report_count": row.report_count,
        }
        for row in rows
    ]


async def get_fountains_nearby(
    db: AsyncSession,
    lat: float, lng: float,
    radius_m: int = 5000,
    limit: int = 50,
) -> List[dict]:
    """Get fountains within radius of a point."""
    point = ST_SetSRID(ST_MakePoint(lng, lat), 4326)
    query = (
        select(
            Fountain.id,
            ST_X(Fountain.location).label("longitude"),
            ST_Y(Fountain.location).label("latitude"),
            Fountain.source,
            Fountain.type,
            Fountain.status,
            Fountain.last_verified,
            Fountain.created_at,
            func.count(Report.id).label("report_count"),
        )
        .outerjoin(Report, Report.fountain_id == Fountain.id)
        .where(ST_DWithin(Fountain.location, point, radius_m, use_spheroid=True))
        .group_by(Fountain.id)
        .limit(limit)
    )
    result = await db.execute(query)
    rows = result.all()
    return [
        {
            "id": row.id,
            "longitude": row.longitude,
            "latitude": row.latitude,
            "source": row.source,
            "type": row.type,
            "status": row.status,
            "last_verified": row.last_verified,
            "created_at": row.created_at,
            "report_count": row.report_count,
        }
        for row in rows
    ]


async def get_fountain_by_id(db: AsyncSession, fountain_id: UUID) -> Optional[Fountain]:
    result = await db.execute(select(Fountain).where(Fountain.id == fountain_id))
    return result.scalar_one_or_none()


async def create_fountain_from_report(
    db: AsyncSession, lat: float, lng: float, source: str = "citizen"
) -> Fountain:
    """Create a new fountain record when a citizen reports one not in our database."""
    fountain = Fountain(
        location=f"SRID=4326;POINT({lng} {lat})",
        source=source,
        type="fountain",
        status="issue",  # new from citizen report, so there's an issue
    )
    db.add(fountain)
    await db.flush()
    return fountain
