import math
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import HostedZone, DNSRecord, User
from schemas import (
    DNSRecordCreate,
    DNSRecordUpdate,
    DNSRecordResponse,
    DNSRecordListResponse,
)
from routers.auth import get_current_user

router = APIRouter(tags=["DNS Records"])


def _get_zone_or_404(zone_id: str, db: Session) -> HostedZone:
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=404, detail="Hosted zone not found")
    return zone


def _update_record_count(zone: HostedZone, db: Session):
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).count()
    db.commit()


@router.get("/api/hosted-zones/{zone_id}/records", response_model=DNSRecordListResponse)
def list_records(
    zone_id: str,
    search: str = Query(default="", description="Search by record name"),
    type: str = Query(default="", description="Filter by record type"),
    page: int = Query(default=1, ge=1),
    per_page: int = Query(default=10, ge=1, le=100),
    sort_by: str = Query(default="name", description="Sort field"),
    sort_order: str = Query(default="asc", description="Sort direction (asc/desc)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_zone_or_404(zone_id, db)

    query = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id)

    if search:
        query = query.filter(DNSRecord.name.ilike(f"%{search}%"))

    if type:
        query = query.filter(DNSRecord.type == type)

    total = query.count()

    sort_column = getattr(DNSRecord, sort_by, DNSRecord.name)
    if sort_order == "desc":
        sort_column = sort_column.desc()
    query = query.order_by(sort_column)

    pages = math.ceil(total / per_page) if total > 0 else 1
    offset = (page - 1) * per_page
    items = query.offset(offset).limit(per_page).all()

    return DNSRecordListResponse(
        items=[DNSRecordResponse.model_validate(r) for r in items],
        total=total,
        page=page,
        per_page=per_page,
        pages=pages,
    )


@router.post("/api/hosted-zones/{zone_id}/records", response_model=DNSRecordResponse, status_code=201)
def create_record(
    zone_id: str,
    record_data: DNSRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    zone = _get_zone_or_404(zone_id, db)

    record = DNSRecord(
        hosted_zone_id=zone.id,
        name=record_data.name,
        type=record_data.type.value,
        value=record_data.value,
        ttl=record_data.ttl,
        routing_policy=record_data.routing_policy.value,
        weight=record_data.weight,
        set_identifier=record_data.set_identifier,
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    _update_record_count(zone, db)

    return DNSRecordResponse.model_validate(record)


@router.get("/api/records/{record_id}", response_model=DNSRecordResponse)
def get_record(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(DNSRecord).filter(DNSRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="DNS record not found")
    return DNSRecordResponse.model_validate(record)


@router.put("/api/records/{record_id}", response_model=DNSRecordResponse)
def update_record(
    record_id: str,
    record_data: DNSRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(DNSRecord).filter(DNSRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="DNS record not found")

    update_fields = record_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        if field == "type" and value is not None:
            setattr(record, field, value.value)
        elif field == "routing_policy" and value is not None:
            setattr(record, field, value.value)
        else:
            setattr(record, field, value)

    db.commit()
    db.refresh(record)
    return DNSRecordResponse.model_validate(record)


@router.delete("/api/records/{record_id}", status_code=204)
def delete_record(
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(DNSRecord).filter(DNSRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="DNS record not found")

    zone = db.query(HostedZone).filter(HostedZone.id == record.hosted_zone_id).first()

    db.delete(record)
    db.commit()

    if zone:
        _update_record_count(zone, db)

    return None
