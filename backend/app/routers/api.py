import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from app.schemas import (
    BeliefsRequest,
    BeliefsResponse,
    CheckinRequest,
    CheckinResponse,
    ErrorDetail,
    ExperimentRequest,
    ExperimentResponse,
    QuestionsRequest,
    QuestionsResponse,
    ReflectRequest,
    ReflectResponse,
)
from app.services.gemini import GeminiService, gemini_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Socratic Thinking Partner"])


def get_gemini_service() -> GeminiService:
    """Dependency injector for GeminiService to allow easy mocking in tests."""
    return gemini_service


@router.post(
    "/beliefs",
    response_model=BeliefsResponse,
    status_code=status.HTTP_200_OK,
    summary="Surface 4-6 Hidden Assumptions",
    description="Analyzes the user's doubt about learning a skill and surfaces 4 to 6 implicit beliefs and mental models.",
    responses={
        422: {"model": ErrorDetail, "description": "Validation Error"},
        500: {"model": ErrorDetail, "description": "Internal Server Error"},
    },
)
async def surface_beliefs(
    payload: BeliefsRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> BeliefsResponse:
    try:
        return await service.get_beliefs(payload)
    except Exception as e:
        logger.error(f"Error in /api/beliefs: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to surface assumptions. Please try again.",
        )


@router.post(
    "/questions",
    response_model=QuestionsResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 4-5 Structured Socratic Questions",
    description="Formulates targeted questions across goal, deadline, trade-offs, transferability, and doubts using surfaced beliefs.",
    responses={
        422: {"model": ErrorDetail, "description": "Validation Error"},
        500: {"model": ErrorDetail, "description": "Internal Server Error"},
    },
)
async def generate_questions(
    payload: QuestionsRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> QuestionsResponse:
    try:
        return await service.get_questions(payload)
    except Exception as e:
        logger.error(f"Error in /api/questions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate questions. Please try again.",
        )


@router.post(
    "/reflect",
    response_model=ReflectResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 2-3 Deep Reflective Questions",
    description="Probes internal motivations, definitions of mastery, and the cost of inaction.",
    responses={
        422: {"model": ErrorDetail, "description": "Validation Error"},
        500: {"model": ErrorDetail, "description": "Internal Server Error"},
    },
)
async def generate_reflection(
    payload: ReflectRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> ReflectResponse:
    try:
        return await service.get_reflect(payload)
    except Exception as e:
        logger.error(f"Error in /api/reflect: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate reflection prompts. Please try again.",
        )


@router.post(
    "/experiment",
    response_model=ExperimentResponse,
    status_code=status.HTTP_200_OK,
    summary="Design a 2-Hour Low-Risk Exploratory Option",
    description="Creates a structured 2-hour sandbox test framed strictly as an exploratory option, never advice.",
    responses={
        422: {"model": ErrorDetail, "description": "Validation Error"},
        500: {"model": ErrorDetail, "description": "Internal Server Error"},
    },
)
async def generate_experiment(
    payload: ExperimentRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> ExperimentResponse:
    try:
        return await service.get_experiment(payload)
    except Exception as e:
        logger.error(f"Error in /api/experiment: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create exploratory experiment. Please try again.",
        )


@router.post(
    "/checkin",
    response_model=CheckinResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate 30-Day Follow-Up Plan",
    description="Produces 30-day reflection questions and trigger events for revisiting the decision.",
    responses={
        422: {"model": ErrorDetail, "description": "Validation Error"},
        500: {"model": ErrorDetail, "description": "Internal Server Error"},
    },
)
async def generate_checkin(
    payload: CheckinRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> CheckinResponse:
    try:
        return await service.get_checkin(payload)
    except Exception as e:
        logger.error(f"Error in /api/checkin: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate check-in plan. Please try again.",
        )
