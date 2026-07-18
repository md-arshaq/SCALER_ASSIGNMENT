import uuid
import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from database import Base


def generate_zone_id():
    return "Z" + uuid.uuid4().hex[:13].upper()


def generate_record_id():
    return "R" + uuid.uuid4().hex[:13].upper()


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    account_id = Column(String(12), default=lambda: str(uuid.uuid4().int)[:12])
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    zone_id = Column(String(14), unique=True, default=generate_zone_id, index=True)
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(10), nullable=False, default="Public")  # Public or Private
    comment = Column(Text, nullable=True, default="")
    record_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    records = relationship("DNSRecord", back_populates="hosted_zone", cascade="all, delete-orphan")


class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    record_id = Column(String(14), unique=True, default=generate_record_id, index=True)
    hosted_zone_id = Column(String, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    type = Column(String(10), nullable=False)  # A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA
    value = Column(Text, nullable=False)  # JSON array of values for multi-value records
    ttl = Column(Integer, default=300)
    routing_policy = Column(String(20), default="Simple")  # Simple, Weighted, Latency, Failover, Geolocation
    weight = Column(Integer, nullable=True)
    set_identifier = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    hosted_zone = relationship("HostedZone", back_populates="records")
