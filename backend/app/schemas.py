from typing import Literal

from pydantic import BaseModel, Field, field_validator

ExperienceLevel = Literal["junior", "mid", "senior", "lead"]
InterviewType = Literal["technical", "behavioral", "system-design", "mixed"]
Difficulty = Literal["easy", "medium", "hard"]


class InterviewContext(BaseModel):
    job_role: str = Field(min_length=1, max_length=200)
    experience_level: ExperienceLevel
    interview_type: InterviewType
    difficulty: Difficulty

    @field_validator("job_role")
    @classmethod
    def strip_role(cls, v: str) -> str:
        return v.strip()


class GeneratedQuestion(BaseModel):
    category: str = Field(min_length=1, max_length=80)
    prompt: str = Field(min_length=10, max_length=4000)
    hint: str | None = Field(default=None, max_length=500)


class GenerateQuestionsRequest(InterviewContext):
    pass


class GenerateQuestionsResponse(BaseModel):
    questions: list[GeneratedQuestion]


class FollowUpRequest(BaseModel):
    context: InterviewContext
    question_prompt: str = Field(min_length=1, max_length=4000)
    candidate_answer: str = Field(min_length=1, max_length=12000)
    question_index: int = Field(ge=0, le=50)


class FollowUpResponse(BaseModel):
    should_ask_follow_up: bool
    follow_up: GeneratedQuestion | None = None


class EvaluateAnswerRequest(BaseModel):
    context: InterviewContext
    question_prompt: str = Field(min_length=1, max_length=4000)
    candidate_answer: str = Field(min_length=1, max_length=12000)


class EvaluateAnswerResponse(BaseModel):
    score: int = Field(ge=0, le=100)
    strengths: list[str]
    weaknesses: list[str]
    clarity_score: int = Field(ge=0, le=100)
    technical_accuracy_score: int = Field(ge=0, le=100)
    improvement_suggestions: list[str]
    summary_feedback: str = Field(max_length=2000)


class QaPair(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    answer: str = Field(max_length=12000)


class FinalSummaryRequest(BaseModel):
    context: InterviewContext
    qa_pairs: list[QaPair] = Field(min_length=1, max_length=30)


class CategoryScore(BaseModel):
    label: str
    score: int = Field(ge=0, le=100)


class FinalSummaryResponse(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    category_scores: list[CategoryScore]
    strengths: list[str]
    improvement_areas: list[str]
    next_steps: list[str]
    summary: str = Field(max_length=3000)
