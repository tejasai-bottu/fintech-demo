from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from api.upload import router as upload_router
from api.receipts import router as receipts_router
from api.analytics import router as analytics_router
from api.stats import router as stats_router
from api.chat import router as chat_router
from database.db import engine
from database import schema
from services.scheduler import start_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    schema.Base.metadata.create_all(bind=engine)
    start_scheduler()
    yield
    # Shutdown

app = FastAPI(
    title="Receipt AI System",
    description="Intelligent receipt processing with semantic memory",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api", tags=["upload"])
app.include_router(receipts_router, prefix="/api", tags=["receipts"])
app.include_router(analytics_router, prefix="/api", tags=["analytics"])
app.include_router(stats_router, prefix="/api", tags=["stats"])
app.include_router(chat_router, prefix="/api", tags=["chat"])

@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Receipt AI System running"}
