from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, field_validator


# === Fountain schemas ===

class FountainBase(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    type: str = "fountain"
    status: str = "unknown"

class FountainOut(BaseModel):
    id: UUID
    latitude: float
    longitude: float
    source: str
    type: str
    status: str
    last_verified: Optional[datetime] = None
    created_at: datetime
    report_count: int = 0

    class Config:
        from_attributes = True


class FountainDetail(FountainOut):
    metadata: Optional[dict] = None
    reports: List["ReportSummary"] = []


# === Report schemas ===

class ReportCreate(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    fountain_id: Optional[UUID] = None
    issue_type: str = Field(..., pattern="^(broken|pressure|dirty|smell|missing|inaccessible)$")
    severity: str = Field("low", pattern="^(low|high)$")
    description: Optional[str] = Field(None, max_length=2000)
    reporter_contact: Optional[str] = Field(None, max_length=255)
    reporter_channel: str = Field("web", pattern="^(web|sms|qr)$")


class ReportSummary(BaseModel):
    id: UUID
    issue_type: str
    severity: str
    status: str
    reporter_channel: str
    reported_at: datetime
    latitude: float
    longitude: float

    class Config:
        from_attributes = True


class StatusHistoryOut(BaseModel):
    old_status: Optional[str]
    new_status: str
    notes: Optional[str]
    changed_at: datetime

    class Config:
        from_attributes = True


class PhotoOut(BaseModel):
    id: UUID
    storage_url: str
    thumbnail_url: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True


class ReportDetail(ReportSummary):
    fountain_id: Optional[UUID] = None
    description: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    in_progress_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    stale_at: Optional[datetime] = None
    status_history: List[StatusHistoryOut] = []
    photos: List[PhotoOut] = []


class ReportStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(acknowledged|in_progress|resolved)$")
    notes: Optional[str] = Field(None, max_length=1000)


# === Admin schemas ===

class AdminLogin(BaseModel):
    email: str
    password: str


class AdminLoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: UUID
    name: str
    role: str


class AdminDashboardStats(BaseModel):
    total_fountains: int
    total_reports: int
    open_reports: int
    resolved_reports: int
    stale_reports: int
    avg_resolution_hours: Optional[float]
    reports_this_month: int


# === City schemas ===

class CityOut(BaseModel):
    id: UUID
    name: str
    state_region: Optional[str]
    country: str
    population: Optional[int]
    fountain_count: int = 0
    open_reports: int = 0

    class Config:
        from_attributes = True


class CityScorecardOut(BaseModel):
    city: CityOut
    total_fountains: int
    pct_working: float
    pct_broken: float
    avg_repair_days: Optional[float]
    reports_last_30_days: int
    reports_resolved_last_30_days: int


# === Query params ===

class FountainQuery(BaseModel):
    bbox: Optional[str] = None  # "min_lng,min_lat,max_lng,max_lat"
    lat: Optional[float] = None
    lng: Optional[float] = None
    radius_m: int = 5000
    status: Optional[str] = None
    limit: int = Field(500, le=5000)
    offset: int = 0


class ReportQuery(BaseModel):
    status: Optional[str] = None
    severity: Optional[str] = None
    issue_type: Optional[str] = None
    days: Optional[int] = None  # reports from last N days
    limit: int = Field(100, le=1000)
    offset: int = 0


# Forward ref resolution
FountainDetail.model_rebuild()
