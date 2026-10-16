import io
import logging
from pathlib import Path

from fastapi import UploadFile

logger = logging.getLogger(__name__)

MAX_BYTES = 5 * 1024 * 1024
EXCERPT_MAX = 8000
ALLOWED_SUFFIXES = {".pdf", ".docx"}


class ResumeProcessingError(Exception):
    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def _extract_pdf(data: bytes) -> str:
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(data))
    parts: list[str] = []
    for page in reader.pages:
        text = page.extract_text() or ""
        if text.strip():
            parts.append(text)
    return "\n".join(parts).strip()


def _extract_docx(data: bytes) -> str:
    from docx import Document

    doc = Document(io.BytesIO(data))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()


async def extract_resume_text(file: UploadFile) -> str:
    if not file.filename:
        raise ResumeProcessingError("Missing filename.")

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_SUFFIXES:
        raise ResumeProcessingError("Only PDF and DOCX files are supported.")

    raw = await file.read()
    if len(raw) == 0:
        raise ResumeProcessingError("The file is empty.")
    if len(raw) > MAX_BYTES:
        raise ResumeProcessingError("File exceeds the 5 MB limit.")

    try:
        text = _extract_pdf(raw) if suffix == ".pdf" else _extract_docx(raw)
    except Exception:
        logger.exception("Resume parse failure")
        raise ResumeProcessingError(
            "Could not read this resume. It may be scanned, corrupted, or password-protected.",
        ) from None

    if not text or len(text.strip()) < 40:
        raise ResumeProcessingError(
            "Very little text was found. Try a text-based PDF or DOCX export.",
        )

    excerpt = text.strip()[:EXCERPT_MAX]
    return excerpt
