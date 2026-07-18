import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models import HostedZone, DNSRecord, User
from schemas import (
    HostedZoneCreate,
    HostedZoneUpdate,
    HostedZoneResponse,
    HostedZoneListResponse,
)
from routers.auth import get_current_user

router = APIRouter(prefix="/api/hosted-zones", tags=["Hosted Zones"])


@router.get("", response_model=HostedZoneListResponse)
def list_hosted_zones(
    search: str = Query(default="", description="Search by domain name"),
    type: str = Query(default="", description="Filter by zone type (Public/Private)"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=100),
    sort_by: str = Query(default="name", description="Sort field"),
    sort_order: str = Query(default="asc", description="Sort direction (asc/desc)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(HostedZone)

    # Search filter
    if search:
        query = query.filter(HostedZone.name.ilike(f"%{search}%"))

    # Type filter
    if type:
        query = query.filter(HostedZone.type == type)

    # Total count
    total = query.count()

    # Sorting
    sort_column = getattr(HostedZone, sort_by, HostedZone.name)
    if sort_order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)

    # Pagination
    pages = math.ceil(total / per_page) if total > 0 else 1
    offset = (page - 1) * per_page
    items = query.offset(offset).limit(per_page).all()

    return HostedZoneListResponse(
        items=[HostedZoneResponse.model_validate(z) for z in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.post("", response_model=HostedZoneResponse, status_code=201)
def create_hosted_zone(
    zone_data: HostedZoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check for duplicate domain name
    existing = db.query(HostedZone).filter(HostedZone.name == zone_data.name).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"Hosted zone '{zone_data.name}' already exists")

    zone = HostedZone(
        name=zone_data.name,
        type=zone_data.type.value,
        comment=zone_data.comment or "",
    )
    db.add(zone)
    db.commit()
    db.refresh(zone)

    # Create default NS and SOA records
    ns_record = DNSRecord(
        hosted_zone_id=zone.id,
        name=zone.name,
        type="NS",
        value="ns-001.awsdns-01.com.\nns-002.awsdns-02.net.\nns-003.awsdns-03.org.\nns-004.awsdns-04.co.uk.",
        ttl=172800,
    )
    soa_record = DNSRecord(
        hosted_zone_id=zone.id,
        name=zone.name,
        type="SOA",
        value="ns-001.awsdns-01.com. hostmaster.example.com. 1 7200 900 1209600 86400",
        ttl=900,
    )
    db.add(ns_record)
    db.add(soa_record)
    zone.record_count = 2
    db.commit()
    db.refresh(zone)

    return HostedZoneResponse.model_validate(zone)


@router.get("/{zone_id}", response_model=HostedZoneResponse)
def get_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return HostedZoneResponse.model_validate(zone)


@router.put("/{zone_id}", response_model=HostedZoneResponse)
def update_hosted_zone(
    zone_id: str,
    zone_data: HostedZoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    if zone_data.comment is not None:
        zone.comment = zone_data.comment

    db.commit()
    db.refresh(zone)
    return HostedZoneResponse.model_validate(zone)


@router.delete("/{zone_id}", status_code=204)
def delete_hosted_zone(
    zone_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")

    db.delete(zone)
    db.commit()
    return None
