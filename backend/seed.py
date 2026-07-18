"""
Seed the database with a demo user and sample hosted zones + records.
Run: python seed.py
"""

from database import engine, SessionLocal, Base
from models import User, HostedZone, DNSRecord
from routers.auth import hash_password

# Create tables
Base.metadata.create_all(bind=engine)

db = SessionLocal()

try:
    # ─── Clear existing data ──────────────────────────────
    db.query(DNSRecord).delete()
    db.query(HostedZone).delete()
    db.query(User).delete()
    db.commit()

    # ─── Create demo user ─────────────────────────────────
    demo_user = User(
        username="admin",
        password_hash=hash_password("password"),
        email="admin@aws-route53-clone.demo",
        account_id="123456789012",
    )
    db.add(demo_user)
    db.commit()
    print(f"[OK] Created demo user: admin / password")

    # ─── Create sample hosted zones ───────────────────────
    zones_data = [
        {"name": "example.com.", "type": "Public", "comment": "Primary production domain"},
        {"name": "staging.example.com.", "type": "Public", "comment": "Staging environment"},
        {"name": "internal.corp.", "type": "Private", "comment": "Internal corporate DNS"},
        {"name": "api.myservice.io.", "type": "Public", "comment": "API service domain"},
        {"name": "docs.myservice.io.", "type": "Public", "comment": "Documentation site"},
    ]

    zones = []
    for zd in zones_data:
        zone = HostedZone(name=zd["name"], type=zd["type"], comment=zd["comment"])
        db.add(zone)
        db.commit()
        db.refresh(zone)
        zones.append(zone)
        print(f"[OK] Created hosted zone: {zone.name} ({zone.zone_id})")

    # ─── Create sample records ────────────────────────────

    # Records for example.com
    example_records = [
        {"name": "example.com.", "type": "NS", "value": "ns-001.awsdns-01.com.\nns-002.awsdns-02.net.\nns-003.awsdns-03.org.\nns-004.awsdns-04.co.uk.", "ttl": 172800},
        {"name": "example.com.", "type": "SOA", "value": "ns-001.awsdns-01.com. hostmaster.example.com. 1 7200 900 1209600 86400", "ttl": 900},
        {"name": "example.com.", "type": "A", "value": "192.0.2.1", "ttl": 300},
        {"name": "www.example.com.", "type": "CNAME", "value": "example.com.", "ttl": 300},
        {"name": "mail.example.com.", "type": "A", "value": "192.0.2.10", "ttl": 300},
        {"name": "example.com.", "type": "MX", "value": "10 mail.example.com.", "ttl": 3600},
        {"name": "example.com.", "type": "TXT", "value": '"v=spf1 include:_spf.google.com ~all"', "ttl": 3600},
        {"name": "_dmarc.example.com.", "type": "TXT", "value": '"v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"', "ttl": 3600},
        {"name": "api.example.com.", "type": "A", "value": "192.0.2.20", "ttl": 60},
        {"name": "cdn.example.com.", "type": "CNAME", "value": "d123456.cloudfront.net.", "ttl": 300},
    ]

    for rd in example_records:
        record = DNSRecord(hosted_zone_id=zones[0].id, **rd)
        db.add(record)

    zones[0].record_count = len(example_records)

    # Records for staging.example.com
    staging_records = [
        {"name": "staging.example.com.", "type": "NS", "value": "ns-101.awsdns-11.com.\nns-102.awsdns-12.net.", "ttl": 172800},
        {"name": "staging.example.com.", "type": "SOA", "value": "ns-101.awsdns-11.com. hostmaster.staging.example.com. 1 7200 900 1209600 86400", "ttl": 900},
        {"name": "staging.example.com.", "type": "A", "value": "198.51.100.1", "ttl": 300},
        {"name": "api.staging.example.com.", "type": "A", "value": "198.51.100.10", "ttl": 60},
    ]

    for rd in staging_records:
        record = DNSRecord(hosted_zone_id=zones[1].id, **rd)
        db.add(record)

    zones[1].record_count = len(staging_records)

    # Records for internal.corp
    internal_records = [
        {"name": "internal.corp.", "type": "NS", "value": "ns-201.awsdns-21.com.\nns-202.awsdns-22.net.", "ttl": 172800},
        {"name": "internal.corp.", "type": "SOA", "value": "ns-201.awsdns-21.com. hostmaster.internal.corp. 1 7200 900 1209600 86400", "ttl": 900},
        {"name": "db.internal.corp.", "type": "A", "value": "10.0.1.100", "ttl": 60},
        {"name": "cache.internal.corp.", "type": "A", "value": "10.0.1.200", "ttl": 60},
        {"name": "app.internal.corp.", "type": "CNAME", "value": "elb-internal-123.us-east-1.elb.amazonaws.com.", "ttl": 300},
    ]

    for rd in internal_records:
        record = DNSRecord(hosted_zone_id=zones[2].id, **rd)
        db.add(record)

    zones[2].record_count = len(internal_records)

    # Records for api.myservice.io
    api_records = [
        {"name": "api.myservice.io.", "type": "NS", "value": "ns-301.awsdns-31.com.\nns-302.awsdns-32.net.", "ttl": 172800},
        {"name": "api.myservice.io.", "type": "SOA", "value": "ns-301.awsdns-31.com. hostmaster.api.myservice.io. 1 7200 900 1209600 86400", "ttl": 900},
        {"name": "api.myservice.io.", "type": "A", "value": "203.0.113.1\n203.0.113.2", "ttl": 60},
        {"name": "api.myservice.io.", "type": "AAAA", "value": "2001:db8::1", "ttl": 300},
        {"name": "api.myservice.io.", "type": "CAA", "value": '0 issue "letsencrypt.org"', "ttl": 3600},
    ]

    for rd in api_records:
        record = DNSRecord(hosted_zone_id=zones[3].id, **rd)
        db.add(record)

    zones[3].record_count = len(api_records)

    # Records for docs.myservice.io
    docs_records = [
        {"name": "docs.myservice.io.", "type": "NS", "value": "ns-401.awsdns-41.com.\nns-402.awsdns-42.net.", "ttl": 172800},
        {"name": "docs.myservice.io.", "type": "SOA", "value": "ns-401.awsdns-41.com. hostmaster.docs.myservice.io. 1 7200 900 1209600 86400", "ttl": 900},
        {"name": "docs.myservice.io.", "type": "CNAME", "value": "myservice-docs.netlify.app.", "ttl": 300},
    ]

    for rd in docs_records:
        record = DNSRecord(hosted_zone_id=zones[4].id, **rd)
        db.add(record)

    zones[4].record_count = len(docs_records)

    db.commit()
    print(f"\n[OK] Seeded {sum(len(r) for r in [example_records, staging_records, internal_records, api_records, docs_records])} DNS records across {len(zones)} hosted zones")
    print("\n[OK] Database seeded successfully!")

finally:
    db.close()
