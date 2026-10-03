import math
import re
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import HTTPException, status
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.schemas.evaluations import (
    EvaluationCreate,
    EvaluationContext,
    EvaluationInput,
    EvaluationListResponse,
    EvaluationResponse,
    EvaluationStats,
    EvaluationUpdate,
)

DEFAULT_TITLE = "Response Quality Evaluation"


def _utc_datetime(value: datetime | None) -> datetime | None:
    if value is not None and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _evaluation_response(document: dict) -> EvaluationResponse:
    return EvaluationResponse(
        id=str(document["_id"]),
        title=document["title"],
        status=document["status"],
        category=document.get("category"),
        input=EvaluationInput.model_validate(document["input"]) if document.get("input") is not None else None,
        context=EvaluationContext.model_validate(document.get("context") or {}),
        created_at=_utc_datetime(document["created_at"]),
        updated_at=_utc_datetime(document["updated_at"]),
        completed_at=_utc_datetime(document.get("completed_at")),
    )


def _user_filter(user: dict) -> dict:
    return {"user_id": user["_id"]}


def _storage_unavailable() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Evaluation storage is unavailable.",
    )


def get_stats(evaluations: Collection, user: dict) -> EvaluationStats:
    owner = _user_filter(user)
    try:
        total = evaluations.count_documents(owner)
        completed = evaluations.count_documents({**owner, "status": "completed"})
        drafts = evaluations.count_documents({**owner, "status": "draft"})
    except PyMongoError:
        raise _storage_unavailable() from None
    return EvaluationStats(
        total_evaluations=total,
        completed_evaluations=completed,
        draft_evaluations=drafts,
        total_issues_found=0,
    )


def get_recent(evaluations: Collection, user: dict) -> list[EvaluationResponse]:
    try:
        documents = evaluations.find(_user_filter(user)).sort("created_at", -1).limit(5)
        return [_evaluation_response(document) for document in documents]
    except PyMongoError:
        raise _storage_unavailable() from None


def list_evaluations(
    evaluations: Collection,
    user: dict,
    *,
    page: int,
    page_size: int,
    search: str | None,
    evaluation_status: str | None,
    sort_order: str,
) -> EvaluationListResponse:
    query = _user_filter(user)
    if search:
        query["title"] = {"$regex": re.escape(search.strip()), "$options": "i"}
    if evaluation_status:
        query["status"] = evaluation_status
    try:
        total = evaluations.count_documents(query)
        total_pages = max(1, math.ceil(total / page_size))
        page = min(page, total_pages)
        documents = (
            evaluations.find(query)
            .sort("created_at", -1 if sort_order == "desc" else 1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )
        return EvaluationListResponse(
            items=[_evaluation_response(document) for document in documents],
            page=page,
            page_size=page_size,
            total=total,
            total_pages=total_pages,
        )
    except PyMongoError:
        raise _storage_unavailable() from None


def create_evaluation(
    evaluations: Collection,
    user: dict,
    payload: EvaluationCreate,
) -> EvaluationResponse:
    now = datetime.now(timezone.utc)
    document = {
        "user_id": user["_id"],
        "title": payload.title or DEFAULT_TITLE,
        "status": "draft",
        "category": None,
        "input": payload.input.model_dump(),
        "context": payload.context.model_dump(),
        "created_at": now,
        "updated_at": now,
        "completed_at": None,
    }
    try:
        result = evaluations.insert_one(document)
    except PyMongoError:
        raise _storage_unavailable() from None
    document["_id"] = result.inserted_id
    return _evaluation_response(document)


def update_evaluation(
    evaluations: Collection,
    user: dict,
    evaluation_id: str,
    payload: EvaluationUpdate,
) -> EvaluationResponse:
    object_id = _parse_object_id(evaluation_id)
    owner_filter = {"_id": object_id, **_user_filter(user)}
    try:
        existing = evaluations.find_one(owner_filter)
        if existing is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evaluation not found.")
        if existing.get("status") != "draft":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only draft evaluations can be edited.")

        evaluations.update_one(
            {**owner_filter, "status": "draft"},
            {"$set": {
                "title": payload.title or DEFAULT_TITLE,
                "input": payload.input.model_dump(),
                "context": payload.context.model_dump(),
                "updated_at": datetime.now(timezone.utc),
            }},
        )
        updated = evaluations.find_one(owner_filter)
    except PyMongoError:
        raise _storage_unavailable() from None

    if updated is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evaluation not found.")
    if updated.get("status") != "draft":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only draft evaluations can be edited.")
    return _evaluation_response(updated)


def get_evaluation(evaluations: Collection, user: dict, evaluation_id: str) -> EvaluationResponse:
    object_id = _parse_object_id(evaluation_id)
    try:
        document = evaluations.find_one({"_id": object_id, **_user_filter(user)})
    except PyMongoError:
        raise _storage_unavailable() from None
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evaluation not found.")
    return _evaluation_response(document)


def delete_evaluation(evaluations: Collection, user: dict, evaluation_id: str) -> None:
    object_id = _parse_object_id(evaluation_id)
    try:
        result = evaluations.delete_one({"_id": object_id, **_user_filter(user)})
    except PyMongoError:
        raise _storage_unavailable() from None
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Evaluation not found.")


def _parse_object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid evaluation ID.")
    return ObjectId(value)
