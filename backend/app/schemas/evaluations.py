from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


EvaluationStatus = Literal["draft", "completed"]


class EvaluationCreate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    input: "EvaluationInput"
    context: "EvaluationContext" = Field(default_factory=lambda: EvaluationContext())

    @field_validator("title", mode="before")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class EvaluationInput(BaseModel):
    original_prompt: str = Field(min_length=1, max_length=12000)
    response_a: str = Field(min_length=1, max_length=20000)
    response_b: str = Field(min_length=1, max_length=20000)

    @field_validator("original_prompt", "response_a", "response_b", mode="before")
    @classmethod
    def normalize_required_input(cls, value: str) -> str:
        if isinstance(value, str):
            value = value.strip()
            if not value:
                raise ValueError("This field is required.")
        return value


class EvaluationContext(BaseModel):
    user_context: str = Field(default="", max_length=5000)
    previous_conversation: str = Field(default="", max_length=12000)
    reference_evidence: str = Field(default="", max_length=12000)
    evaluation_notes: str = Field(default="", max_length=5000)

    @field_validator("user_context", "previous_conversation", "reference_evidence", "evaluation_notes", mode="before")
    @classmethod
    def normalize_context(cls, value: str | None) -> str:
        return value.strip() if isinstance(value, str) else ""


class EvaluationUpdate(EvaluationCreate):
    pass


class EvaluationResponse(BaseModel):
    id: str
    title: str
    status: EvaluationStatus
    category: str | None = None
    input: EvaluationInput | None = None
    context: EvaluationContext = Field(default_factory=EvaluationContext)
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


class EvaluationStats(BaseModel):
    total_evaluations: int
    completed_evaluations: int
    draft_evaluations: int
    total_issues_found: int


class EvaluationListResponse(BaseModel):
    items: list[EvaluationResponse]
    page: int
    page_size: int
    total: int
    total_pages: int
