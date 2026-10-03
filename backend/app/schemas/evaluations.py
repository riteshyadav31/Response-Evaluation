from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator


EvaluationStatus = Literal["draft", "completed"]


class EvaluationCreate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)

    @field_validator("title", mode="before")
    @classmethod
    def normalize_title(cls, value: str | None) -> str | None:
        if isinstance(value, str):
            value = value.strip()
            return value or None
        return value


class EvaluationResponse(BaseModel):
    id: str
    title: str
    status: EvaluationStatus
    category: str | None = None
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
