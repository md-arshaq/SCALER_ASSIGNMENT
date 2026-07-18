from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Enums ────────────────────────────────────────────────

class ZoneType(str, Enum):
    Public = "Public"
    Private = "Private"


class RecordType(str, Enum):
    A = "A"
    AAAA = "AAAA"
    CNAME = "CNAME"
    TXT = "TXT"
    MX = "MX"
    NS = "NS"
    PTR = "PTR"
    SRV = "SRV"
    CAA = "CAA"
    SOA = "SOA"


class RoutingPolicy(str, Enum):
    Simple = "Simple"
    Weighted = "Weighted"
    Latency = "Latency"
    Failover = "Failover"
    Geolocation = "Geolocation"


# ─── Auth Schemas ─────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=50)
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: str
    username: str
    email: Optional[str] = None
    account_id: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Hosted Zone Schemas ─────────────────────────────────

class HostedZoneCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Domain name (e.g., example.com)")
    type: ZoneType = ZoneType.Public
    comment: Optional[str] = Field(default="", max_length=256)

    @field_validator("name")
    @classmethod
    def validate_domain_name(cls, v: str) -> str:
        v = v.strip().rstrip(".")
        if not v:
            raise ValueError("Domain name cannot be empty")
        # Add trailing dot for FQDN consistency
        return v + "." if not v.endswith(".") else v


class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = Field(default=None, max_length=256)


class HostedZoneResponse(BaseModel):
    id: str
    zone_id: str
    name: str
    type: str
    comment: Optional[str] = ""
    record_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class HostedZoneListResponse(BaseModel):
    items: List[HostedZoneResponse]
    total: int
    page: int
    per_page: int
    pages: int


# ─── DNS Record Schemas ──────────────────────────────────

class DNSRecordCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    type: RecordType
    value: str = Field(..., min_length=1, description="Record value(s), newline-separated for multi-value")
    ttl: int = Field(default=300, ge=0, le=2147483647)
    routing_policy: RoutingPolicy = RoutingPolicy.Simple
    weight: Optional[int] = Field(default=None, ge=0, le=255)
    set_identifier: Optional[str] = Field(default=None, max_length=128)


class DNSRecordUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    type: Optional[RecordType] = None
    value: Optional[str] = Field(default=None, min_length=1)
    ttl: Optional[int] = Field(default=None, ge=0, le=2147483647)
    routing_policy: Optional[RoutingPolicy] = None
    weight: Optional[int] = Field(default=None, ge=0, le=255)
    set_identifier: Optional[str] = Field(default=None, max_length=128)


class DNSRecordResponse(BaseModel):
    id: str
    record_id: str
    hosted_zone_id: str
    name: str
    type: str
    value: str
    ttl: int
    routing_policy: str
    weight: Optional[int] = None
    set_identifier: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DNSRecordListResponse(BaseModel):
    items: List[DNSRecordResponse]
    total: int
    page: int
    per_page: int
    pages: int
