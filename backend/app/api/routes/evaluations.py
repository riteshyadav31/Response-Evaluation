from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, Response, status
from pymongo.collection import Collection

from app.api.dependencies import get_current_user, get_evaluations_collection
from app.schemas.evaluations import (
    EvaluationCreate,
    EvaluationListResponse,
    EvaluationResponse,
    EvaluationStats,
)
from app.services.evaluation_service import (
    create_evaluation,
    delete_evaluation,
    get_evaluation,
    get_recent,
    get_stats,
    list_evaluations,
)

router = APIRouter(prefix="/evaluations", tags=["evaluations"])
Evaluations = Annotated[Collection, Depends(get_evaluations_collection)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("/stats", response_model=EvaluationStats)
def evaluation_stats(evaluations: Evaluations, user: CurrentUser) -> EvaluationStats:
    return get_stats(evaluations, user)


@router.get("/recent", response_model=list[EvaluationResponse])
def recent_evaluations(evaluations: Evaluations, user: CurrentUser) -> list[EvaluationResponse]:
    return get_recent(evaluations, user)


@router.get("/", response_model=EvaluationListResponse)
def evaluation_history(
    evaluations: Evaluations,
    user: CurrentUser,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 10,
    search: Annotated[str | None, Query(max_length=200)] = None,
    evaluation_status: Annotated[Literal["draft", "completed"] | None, Query(alias="status")] = None,
    sort_order: Annotated[Literal["asc", "desc"], Query(alias="sort")] = "desc",
) -> EvaluationListResponse:
    return list_evaluations(
        evaluations,
        user,
        page=page,
        page_size=page_size,
        search=search,
        evaluation_status=evaluation_status,
        sort_order=sort_order,
    )


@router.post("/", response_model=EvaluationResponse, status_code=status.HTTP_201_CREATED)
def create_draft(
    payload: EvaluationCreate,
    evaluations: Evaluations,
    user: CurrentUser,
) -> EvaluationResponse:
    return create_evaluation(evaluations, user, payload)


@router.get("/{evaluation_id}", response_model=EvaluationResponse)
def evaluation_details(
    evaluation_id: str,
    evaluations: Evaluations,
    user: CurrentUser,
) -> EvaluationResponse:
    return get_evaluation(evaluations, user, evaluation_id)


@router.delete("/{evaluation_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_evaluation(
    evaluation_id: str,
    evaluations: Evaluations,
    user: CurrentUser,
) -> Response:
    delete_evaluation(evaluations, user, evaluation_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
