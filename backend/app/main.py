from fastapi import FastAPI

from app.routers.analysis import router as analysis_router

app = FastAPI(
    title="CITI-Senti API",
    version="0.1.0",
    description="Backend API for the CITI-Senti web application.",
)

app.include_router(analysis_router)


@app.get("/api/v1/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "citi-senti-api",
    }
