from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import auth, hosted_zones, records

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Route53 Clone API",
    description="AWS Route53 Console Clone — Backend API",
    version="1.0.0",
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router)
app.include_router(hosted_zones.router)
app.include_router(records.router)


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "route53-clone"}
