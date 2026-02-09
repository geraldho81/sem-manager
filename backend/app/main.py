from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import projects, pipeline, exports
from app.api.websocket import router as ws_router

app = FastAPI(
    title="SEM Manager API",
    description="Multi-Agent SEM Manager with AI-Powered Keyword Research & RSA Generation",
    version="1.0.0",
)

cors_origins = list(settings.CORS_ORIGINS)
if settings.FRONTEND_URL:
    cors_origins.append(settings.FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(pipeline.router, prefix="/api/pipeline", tags=["pipeline"])
app.include_router(exports.router, prefix="/api/exports", tags=["exports"])
app.include_router(ws_router, prefix="/ws", tags=["websocket"])


@app.get("/")
async def root():
    return {
        "name": "SEM Manager API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
