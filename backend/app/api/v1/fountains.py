from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services import fountain_service
from app.schemas.api import FountainOut, FountainDetail

router = APIRouter(prefix="/fountains", tags=["fountains"])


@router.get("", response_model=list[FountainOut])
async def list_fountains(
    bbox: Optional[str] = Query(None, description="min_lng,min_lat,max_lng,max_lat"),
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    radius_m: int = Query(5000, le=50000),
    status: Optional[str] = Query(None),
    limit: int = Query(500, le=5000),
    offset: int = Query(0),
    db: AsyncSession = Depends(get_db),
):
    """List fountains by bounding box or proximity."""
    if bbox:
        try:
            parts = [float(x) for x in bbox.split(",")]
            min_lng, min_lat, max_lng, max_lat = parts
        except (ValueError, IndexError):
            raise HTTPException(400, "bbox must be min_lng,min_lat,max_lng,max_lat")
        fountains = await fountain_service.get_fountains_bbox(
            db, min_lng, min_lat, max_lng, max_lat, status=status, limit=limit, offset=offset
        )
    elif lat is not None and lng is not None:
        fountains = await fountain_service.get_fountains_nearby(
            db, lat, lng, radius_m=radius_m, limit=limit
        )
    else:
        raise HTTPException(400, "Provide either bbox or lat+lng parameters")

    return fountains


@router.get("/nearby", response_model=list[FountainOut])
async def nearby_fountains(
    lat: float = Query(...),
    lng: float = Query(...),
    radius_m: int = Query(1000, le=50000),
    limit: int = Query(20, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get nearest fountains to a point."""
    return await fountain_service.get_fountains_nearby(db, lat, lng, radius_m, limit)


@router.get("/{fountain_id}")
async def get_fountain(
    fountain_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get a single fountain with its report history."""
    fountain = await fountain_service.get_fountain_by_id(db, fountain_id)
    if not fountain:
        raise HTTPException(404, "Fountain not found")
    return fountain

@router.get("/stats/summary")
async def get_summary_stats(db: AsyncSession = Depends(get_db)):
    """Public summary stats for the landing page."""
    from sqlalchemy import func, select
    from app.models.fountain import Fountain
    from app.models.report import Report

    fountain_count = await db.execute(select(func.count(Fountain.id)))
    report_count = await db.execute(select(func.count(Report.id)))

    # Count cities from both fountains and reports
    fountain_cities = await db.execute(
        select(func.count(func.distinct(Fountain.city))).where(Fountain.city.isnot(None))
    )
    report_cities = await db.execute(
        select(func.count(func.distinct(Report.city))).where(Report.city.isnot(None))
    )

    # Use whichever is higher, or combine
    city_count = max(fountain_cities.scalar() or 0, report_cities.scalar() or 0)

    return {
        "fountain_count": fountain_count.scalar() or 0,
        "report_count": report_count.scalar() or 0,
        "city_count": city_count if city_count > 0 else 1,
    }