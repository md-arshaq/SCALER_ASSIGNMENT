# Project Requirements: AWS Route53 Clone

## Objective
Build a functional clone of the AWS Route53 web application with persistent storage and a backend API. Focus is on recreating the **Route53 user experience and core workflows**, not actual DNS functionality (i.e., records are stored/managed but do not need to actually resolve DNS).

## Tech Stack
- **Frontend:** Next.js (TypeScript)
- **Backend:** FastAPI
- **Database:** SQLite

## Repository Structure
```
/frontend   - Next.js app
/backend    - FastAPI app
/README.md  - Setup, architecture, schema, API docs
```

---

## Feature Scope

### 1. Authentication (Mocked)
- Login
- Logout
- Session persistence
- IAM, AWS Accounts, Organizations, Billing, and other AWS dependencies can be mocked/stubbed — no need for real implementations.

### 2. Hosted Zones (Full CRUD)
Users should be able to:
- View Hosted Zones (list/table view)
- Search Hosted Zones
- Create Hosted Zones
- Edit Hosted Zones
- Delete Hosted Zones

All data must persist in SQLite.

### 3. DNS Records (Full CRUD, scoped within a Hosted Zone)
Support standard Route53 record types:
- A
- AAAA
- CNAME
- TXT
- MX
- NS
- PTR
- SRV
- CAA

Users should be able to:
- View Records
- Search Records
- Create Records
- Edit Records
- Delete Records

All data must persist in SQLite.

### 4. Route53 UX Fidelity
The app should closely resemble the real Route53 console, including:
- Navigation structure (sidebar/nav matching AWS console patterns)
- Hosted Zone management screens
- DNS Record management screens
- Tables (sortable, with row actions)
- Forms (create/edit with validation)
- Search
- Filters
- Pagination
- Modals (confirmations, create/edit dialogs)
- Notifications/toasts (success, error, warnings)

**Goal:** the app should feel like Route53, not a generic CRUD admin panel — attention to layout, spacing, terminology, and interaction patterns matters.

### 5. Mocked/Placeholder Sections
These only need placeholder pages (e.g. "Coming Soon"):
- Dashboard
- Traffic Policies
- Health Checks
- Resolver
- Profiles

---

## Bonus Features (Optional)
- Import DNS records from BIND zone files
- Export Hosted Zones as JSON or BIND format
- Dark Mode
- Keyboard Shortcuts
- Bulk Operations

---

## Deliverables

### Source Code
GitHub repository containing:
- `frontend/`
- `backend/`

### Documentation (README)
Must include:
- Setup instructions
- Architecture overview
- Database schema
- API overview

### Demo
- A hosted, working link to the deployed application

---

## Evaluation Criteria
1. UI similarity to Route53
2. Frontend engineering quality
3. Backend/API design
4. Database design
5. Code quality and maintainability
6. Documentation
7. Overall completeness

---

## Suggested Build Notes (for agent planning)

These aren't in the original spec but are reasonable defaults an implementing agent can assume unless told otherwise:

- **Backend:** FastAPI with SQLAlchemy (or SQLModel) ORM, Pydantic schemas for request/response validation, SQLite via a local `.db` file.
- **Auth:** Simple mocked session-based or JWT-based auth is acceptable — no need for a real identity provider.
- **DB schema (minimum):**
  - `users` (mocked auth)
  - `hosted_zones` (id, name, type [public/private], comment, record_count, created_at)
  - `dns_records` (id, hosted_zone_id FK, name, type, value(s), ttl, routing_policy [optional], created_at)
- **API design:** RESTful routes, e.g.:
  - `POST /auth/login`, `POST /auth/logout`, `GET /auth/session`
  - `GET/POST /hosted-zones`, `GET/PUT/DELETE /hosted-zones/{id}`
  - `GET/POST /hosted-zones/{id}/records`, `GET/PUT/DELETE /records/{id}`
  - Support query params for search, filter, and pagination on list endpoints.
- **Frontend:** App Router (Next.js), component structure mirroring AWS console conventions (top nav + left sidebar + main content table), reusable Table/Modal/Form/Toast components.
