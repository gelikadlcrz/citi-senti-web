"""HTTP interface for temporary citizen feedback analysis."""
import logging
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, field_validator

from app.ml.labels import ASPECT_CODES
from app.ml.service import AnalysisService, ModelUnavailable, service

router = APIRouter(prefix="/api/v1", tags=["Analysis"])
logger = logging.getLogger(__name__)


class AnalysisRequest(BaseModel):
    comment: str = Field(min_length=1, max_length=1000)

    @field_validator("comment")
    @classmethod
    def nonblank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Comment must not be blank")
        return value.strip()


class Prediction(BaseModel):
    aspect_code: str
    sentiment: Literal["negative", "neutral", "positive"]

    @field_validator("aspect_code")
    @classmethod
    def known_code(cls, value: str) -> str:
        if value not in ASPECT_CODES:
            raise ValueError("Unknown aspect code")
        return value


class AnalysisResponse(BaseModel):
    comment: str
    predictions: list[Prediction]
    model_version: str = Field(min_length=1)
    mode: Literal["live"]

    @field_validator("predictions")
    @classmethod
    def unique_aspects(cls, value: list[Prediction]) -> list[Prediction]:
        codes = [prediction.aspect_code for prediction in value]
        if len(codes) != len(set(codes)):
            raise ValueError("Duplicate aspect predictions")
        return value


def get_analysis_service() -> AnalysisService:
    return service


@router.post(
    "/analysis",
    response_model=AnalysisResponse,
    responses={500: {"description": "Analysis failed"},
               503: {"description": "Analysis model unavailable"}},
)
def analyze(
    request: AnalysisRequest,
    engine: AnalysisService = Depends(get_analysis_service),
) -> AnalysisResponse:
    try:
        return AnalysisResponse.model_validate(engine.predict(request.comment))
    except ModelUnavailable:
        raise HTTPException(status_code=503, detail="Analysis model is unavailable.") from None
    except Exception:
        # Do not expose internal paths, errors or submitted text to the client.
        logger.error("Feedback inference or response validation failed")
        raise HTTPException(status_code=500, detail="Analysis failed.") from None
