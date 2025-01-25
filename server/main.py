from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.mongodb import db
from app.core.config import settings
from app.api.endpoints import (
    institutions, 
    recommendations,
    auth,
    data_import
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database events
@app.on_event("startup")
async def startup_db_client():
    await db.connect_to_database()
    await create_indexes()

@app.on_event("shutdown")
async def shutdown_db_client():
    await db.close_database_connection()

# Create database indexes
async def create_indexes():
    try:
        await db.db.institutions.create_index("institute_id", unique=True)
        await db.db.institutions.create_index("current_ranking")
        await db.db.institutions.create_index([("location.state", 1)])
    except Exception as e:
        print(f"Error creating indexes: {e}")

# Health check
@app.get("/api/health")
async def health_check():
    try:
        await db.db.command("ping")
        return {
            "status": "healthy",
            "message": "API is running",
            "database": "connected"
        }
    except Exception:
        return {
            "status": "unhealthy",
            "message": "API is running",
            "database": "disconnected"
        }

# API routers
app.include_router(
    institutions.router,
    prefix=f"{settings.API_V1_STR}/institutions",
    tags=["institutions"]
)

app.include_router(
    recommendations.router,
    prefix=f"{settings.API_V1_STR}/recommendations",
    tags=["recommendations"]
)

app.include_router(
    auth.router,
    prefix=f"{settings.API_V1_STR}/auth",
    tags=["authentication"]
)

app.include_router(
    data_import.router,
    prefix=f"{settings.API_V1_STR}/data",
    tags=["data-management"]
)

# Server startup
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    )