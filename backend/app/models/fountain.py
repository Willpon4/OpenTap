import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, BigInteger, Index, text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from geoalchemy2 import Geometry
from app.core.database import Base


class Fountain(Base):
    __tablename__ = "fountains"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    source = Column(String(20), nullable=False, default="osm")  # osm, citizen, city_data
    osm_id = Column(BigInteger, nullable=True, unique=True)
    type = Column(String(30), nullable=False, default="fountain")  # fountain, bottle_filler, spigot, tap, other
    status = Column(String(20), nullable=False, default="unknown")  # working, issue, broken, unknown
    last_verified = Column(DateTime(timezone=True), nullable=True)
    metadata_ = Column("metadata", JSONB, nullable=True, default=dict)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        Index("ix_fountains_location", location, postgresql_using="gist"),
        Index("ix_fountains_status", status),
        Index("ix_fountains_osm_id", osm_id, unique=True, postgresql_where=text("osm_id IS NOT NULL")),
    )
