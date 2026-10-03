from datetime import datetime, timezone

from fastapi import HTTPException, status
from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError, PyMongoError

from app.core.security import DUMMY_PASSWORD_HASH, hash_password, verify_password
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse


def public_user(document: dict) -> UserResponse:
    created_at = document["created_at"]
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return UserResponse(
        id=str(document["_id"]),
        full_name=document["full_name"],
        email=document["email"],
        created_at=created_at,
    )


def register_user(users: Collection, payload: RegisterRequest) -> UserResponse:
    email = str(payload.email).strip().lower()
    try:
        existing_user = users.find_one({"email": email}, {"_id": 1})
    except PyMongoError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="User storage is unavailable.") from None
    if existing_user:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.")

    now = datetime.now(timezone.utc)
    document = {
        "full_name": payload.full_name,
        "email": email,
        "hashed_password": hash_password(payload.password.get_secret_value()),
        "role": "evaluator",
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }
    try:
        result = users.insert_one(document)
        document["_id"] = result.inserted_id
    except DuplicateKeyError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An account with this email already exists.") from None
    except PyMongoError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="User storage is unavailable.") from None
    return public_user(document)


def authenticate_user(users: Collection, payload: LoginRequest) -> dict | None:
    email = str(payload.email).strip().lower()
    try:
        user = users.find_one({"email": email})
    except PyMongoError:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="User storage is unavailable.") from None

    hashed_password = user.get("hashed_password") if user else DUMMY_PASSWORD_HASH.decode("ascii")
    password_matches = verify_password(payload.password.get_secret_value(), hashed_password)
    if user is None or not password_matches or not user.get("is_active", False):
        return None
    return user


