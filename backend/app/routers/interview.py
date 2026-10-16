from fastapi import APIRouter, Depends, HTTPException

from app.gemini_service import GeminiService, GeminiServiceError, get_gemini_service
from app.schemas import (
    EvaluateAnswerRequest,
    EvaluateAnswerResponse,
    FinalSummaryRequest,
    FinalSummaryResponse,
    FollowUpRequest,
    FollowUpResponse,
    GenerateQuestionsRequest,
    GenerateQuestionsResponse,
)

router = APIRouter(prefix="/api/interview", tags=["interview"])


def _handle_gemini(exc: GeminiServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=str(exc))


@router.post("/generate-questions", response_model=GenerateQuestionsResponse)
def generate_questions(
    body: GenerateQuestionsRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> GenerateQuestionsResponse:
    try:
        return service.generate_questions(body)
    except GeminiServiceError as exc:
        raise _handle_gemini(exc) from exc


@router.post("/follow-up", response_model=FollowUpResponse)
def follow_up(
    body: FollowUpRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> FollowUpResponse:
    try:
        return service.follow_up(
            body.context,
            body.question_prompt,
            body.candidate_answer,
            body.question_index,
        )
    except GeminiServiceError as exc:
        raise _handle_gemini(exc) from exc


@router.post("/evaluate-answer", response_model=EvaluateAnswerResponse)
def evaluate_answer(
    body: EvaluateAnswerRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> EvaluateAnswerResponse:
    try:
        return service.evaluate_answer(
            body.context,
            body.question_prompt,
            body.candidate_answer,
        )
    except GeminiServiceError as exc:
        raise _handle_gemini(exc) from exc


@router.post("/final-summary", response_model=FinalSummaryResponse)
def final_summary(
    body: FinalSummaryRequest,
    service: GeminiService = Depends(get_gemini_service),
) -> FinalSummaryResponse:
    try:
        pairs = [{"question": p.question, "answer": p.answer} for p in body.qa_pairs]
        return service.final_summary(body.context, pairs)
    except GeminiServiceError as exc:
        raise _handle_gemini(exc) from exc
