from fastapi import APIRouter, File, UploadFile

from app.resume_service import ResumeProcessingError, extract_resume_text

router = APIRouter(prefix="/api/resume", tags=["resume"])


@router.post("/extract")
async def extract_resume(file: UploadFile = File(...)) -> dict[str, str]:
    try:
        excerpt = await extract_resume_text(file)
    except ResumeProcessingError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    return {"excerpt": excerpt, "character_count": str(len(excerpt))}
