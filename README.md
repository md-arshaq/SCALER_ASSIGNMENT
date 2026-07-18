# AWS Route 53 Console Clone

A full-stack clone of the AWS Route 53 management console, featuring hosted zone management, DNS record CRUD operations, and an AWS-authentic user interface.

## Tech Stack

| Layer      | Technology                     |
|------------|-------------------------------|
| Frontend   | Next.js 15 (TypeScript, App Router) |
| Backend    | FastAPI (Python)               |
| Database   | SQLite (via SQLAlchemy ORM)    |
| Auth       | JWT (mocked, session-based)    |
| Styling    | Vanilla CSS (AWS CloudScape-inspired) |

## Architecture

```
frontend/ (Next.js)          backend/ (FastAPI)         Database
┌────────────────────┐       ┌──────────────────┐      ┌──────────┐
│  App Router Pages  │──────▶│  REST API        │─────▶│  SQLite  │
│  React Context     │ HTTP  │  JWT Auth        │  SQL │route53.db│
│  AWS Console UI    │◀──────│  SQLAlchemy ORM  │◀─────│          │
└────────────────────┘       └──────────────────┘      └──────────┘
     Port 3000                    Port 8000
```

## Features

### Core Features
- **Authentication** — Mocked JWT-based login/logout with session persistence
- **Hosted Zones (Full CRUD)** — Create, read, update, delete hosted zones with search, filter, sort, and pagination
- **DNS Records (Full CRUD)** — Manage A, AAAA, CNAME, TXT, MX, NS, PTR, SRV, CAA records scoped within hosted zones
- **Auto NS/SOA Records** — Default NS and SOA records created automatically with each hosted zone

### UI/UX Features
- AWS Console-authentic layout (top nav, sidebar, main content area)
- Sortable data tables with row selection and bulk actions
- Search and filter capabilities
- Pagination with configurable page sizes
- Modal dialogs for create/edit/delete operations
- Toast notifications (success, error, warning)
- Loading skeletons and spinners
- Empty states with call-to-action
- Responsive design
- Dark mode support

### Placeholder Pages
- Dashboard (with summary stats)
- Health Checks
- Traffic Policies
- Resolver
- Profiles

## Database Schema

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────────┐
│     users        │       │    hosted_zones       │       │    dns_records       │
├─────────────────┤       ├──────────────────────┤       ├─────────────────────┤
│ id (PK)         │       │ id (PK)              │       │ id (PK)             │
│ username        │       │ zone_id (unique)     │◀──────│ record_id (unique)  │
│ password_hash   │       │ name                 │  FK   │ hosted_zone_id (FK) │
│ email           │       │ type (Public/Private)│───────│ name                │
│ account_id      │       │ comment              │       │ type (A/AAAA/...)   │
│ created_at      │       │ record_count         │       │ value               │
└─────────────────┘       │ created_at           │       │ ttl                 │
                          │ updated_at           │       │ routing_policy      │
                          └──────────────────────┘       │ weight              │
                                                         │ set_identifier      │
                                                         │ created_at          │
                                                         │ updated_at          │
                                                         └─────────────────────┘
```

## API Reference

### Authentication
| Method | Endpoint            | Description          |
|--------|--------------------|-----------------------|
| POST   | `/api/auth/login`  | Login with credentials |
| POST   | `/api/auth/logout` | Logout (discard token) |
| GET    | `/api/auth/session`| Get current user info  |

### Hosted Zones
| Method | Endpoint                  | Description                    |
|--------|--------------------------|--------------------------------|
| GET    | `/api/hosted-zones`      | List zones (search, filter, paginate, sort) |
| POST   | `/api/hosted-zones`      | Create a new hosted zone       |
| GET    | `/api/hosted-zones/{id}` | Get zone details               |
| PUT    | `/api/hosted-zones/{id}` | Update zone comment            |
| DELETE | `/api/hosted-zones/{id}` | Delete zone and all records    |

### DNS Records
| Method | Endpoint                              | Description                     |
|--------|--------------------------------------|---------------------------------|
| GET    | `/api/hosted-zones/{id}/records`     | List records (search, filter, paginate, sort) |
| POST   | `/api/hosted-zones/{id}/records`     | Create a new record             |
| GET    | `/api/records/{id}`                  | Get record details              |
| PUT    | `/api/records/{id}`                  | Update a record                 |
| DELETE | `/api/records/{id}`                  | Delete a record                 |

**Query Parameters** (list endpoints): `search`, `type`, `page`, `per_page`, `sort_by`, `sort_order`

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with demo data
python seed.py

# Start the server
uvicorn main:app --reload --port 8000
```

**Demo credentials:** `admin` / `password`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at **http://localhost:3000**.

### Quick Start (Both)

In two terminal windows:

```bash
# Terminal 1 — Backend
cd backend && .\venv\Scripts\activate && uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend  
cd frontend && npm run dev
```

## Project Structure

```
SCALER-ASSIGNMENT/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── database.py          # SQLAlchemy engine & session
│   ├── models.py            # ORM models (User, HostedZone, DNSRecord)
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── seed.py              # Demo data seeder
│   ├── requirements.txt     # Python dependencies
│   └── routers/
│       ├── auth.py          # Auth endpoints (login/logout/session)
│       ├── hosted_zones.py  # Hosted zones CRUD
│       └── records.py       # DNS records CRUD
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx           # Root layout
│   │   │   ├── template.tsx         # App shell wrapper
│   │   │   ├── page.tsx             # Root redirect
│   │   │   ├── globals.css          # AWS CloudScape design system
│   │   │   ├── login/page.tsx       # Login page
│   │   │   ├── dashboard/page.tsx   # Dashboard
│   │   │   ├── hosted-zones/
│   │   │   │   ├── page.tsx         # Hosted zones list
│   │   │   │   ├── create/page.tsx  # Create hosted zone
│   │   │   │   └── [id]/page.tsx    # Zone detail + records
│   │   │   ├── health-checks/       # Placeholder
│   │   │   ├── traffic-policies/    # Placeholder
│   │   │   ├── resolver/            # Placeholder
│   │   │   └── profiles/            # Placeholder
│   │   ├── components/
│   │   │   ├── AppShell.tsx         # Auth-guarded layout shell
│   │   │   ├── TopNav.tsx           # AWS top navigation bar
│   │   │   └── Sidebar.tsx          # Route 53 sidebar
│   │   ├── context/
│   │   │   ├── AuthContext.tsx      # Authentication state
│   │   │   └── ToastContext.tsx     # Toast notifications
│   │   └── lib/
│   │       ├── api.ts              # Typed API client
│   │       └── types.ts            # TypeScript interfaces
│   └── package.json
│
└── README.md
```

## Screenshots

After logging in, you'll see the AWS-style console with:
1. **Top navigation** — Dark bar with Route 53 logo, search, region selector, account menu
2. **Sidebar** — Navigation links matching the real Route 53 console
3. **Hosted zones table** — Sortable, searchable, with type badges and actions
4. **Zone detail view** — Zone metadata header + DNS records table with full CRUD
5. **Create/edit modals** — AWS-style form dialogs with validation

## License

This project is an educational clone built for a Scaler assignment. Not affiliated with Amazon Web Services.
