import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fountain_id = Column(UUID(as_uuid=True), ForeignKey("fountains.id"), nullable=True)
    location = Column(Geometry("POINT", srid=4326), nullable=False)
    issue_type = Column(String(30), nullable=False)  # broken, pressure, dirty, smell, missing, inaccessible
    severity = Column(String(10), nullable=False, default="low")  # low, high
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="reported")  # reported, acknowledged, in_progress, resolved, stale
    reporter_contact = Column(String(255), nullable=True)  # encrypted email or phone
    reporter_channel = Column(String(10), nullable=False, default="web")  # web, sms, qr

    # Lifecycle timestamps
    reported_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    in_progress_at = Column(DateTime(timezone=True), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    stale_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationships
    status_history = relationship("StatusHistory", back_populates="report", order_by="StatusHistory.changed_at")
    photos = relationship("ReportPhoto", back_populates="report")

    __table_args__ = (
        Index("ix_reports_location", location, postgresql_using="gist"),
        Index("ix_reports_status", status),
        Index("ix_reports_fountain_id", fountain_id),
        Index("ix_reports_reported_at", reported_at),
    )
