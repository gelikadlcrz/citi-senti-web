from fastapi import FastAPI

app = FastAPI(
    title="CITI-Senti API",
    version="0.1.0",
    description="Backend API for the CITI-Senti web application.",
)


@app.get("/api/v1/health", tags=["Health"])
def health_check() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "citi-senti-api",
    }