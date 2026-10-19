"""FastAPI-app: CORS, routers, foutafhandeling en een health-check."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import auth, brands, dashboard, generate, posts
from app.services.ai.writer import AIError
from app.services.source_fetcher import SourceError

settings = get_settings()

app = FastAPI(title="PostPilot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (auth, brands, generate, posts, dashboard):
    app.include_router(module.router)


# Fouten uit de AI- en bronlaag als vertaalbare code teruggeven ({"detail": "<code>"})
@app.exception_handler(AIError)
def _ai_error(_request: Request, exc: AIError):
    return JSONResponse(status_code=exc.status, content={"detail": exc.code})


@app.exception_handler(SourceError)
def _source_error(_request: Request, exc: SourceError):
    return JSONResponse(status_code=422, content={"detail": exc.code})


@app.get("/health")
def health() -> dict[str, str]:
    """Wordt door de hosting gebruikt om te controleren of de API draait."""
    return {"status": "ok"}
