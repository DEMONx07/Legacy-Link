from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import db
from app.api.router import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Preserve memories. Transcend time.",
    version=settings.VERSION
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.connect()

@app.on_event("shutdown")
async def shutdown():
    await db.disconnect()

@app.get("/")
async def root():
    return {"message": "LegacyLink API", "version": settings.VERSION, "demo_mode": settings.DEMO_MODE}

@app.get("/api/health")
async def health():
    db_ok = db.pool is not None
    return {"status": "healthy", "database": db_ok, "demo_mode": settings.DEMO_MODE}

# Include routers
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
