from typing import Annotated

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import Depends, HTTPException, Request, status
from pymongo.collection import Collection
from pymongo.database import Database
from pymongo.errors import PyMongoError
from fastapi.security import OAuth2PasswordBearer

from app.core.config import settings
from app.core.security import decode_access_token
from app.database.connection import mongodb

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)


def get_users_collection() -> Collection:
    if mongodb.client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="User storage is unavailable.",
        )
    database: Database = mongodb.client[settings.database_name]
    return database["users"]


def get_evaluations_collection() -> Collection:
    if mongodb.client is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Evaluation storage is unavailable.",
        )
    database: Database = mongodb.client[settings.database_name]
    return database["evaluations"]


def get_current_user(
    request: Request,
    bearer_token: Annotated[str | None, Depends(oauth2_scheme)],
    users: Annotated[Collection, Depends(get_users_collection)],
) -> dict:
    token = request.cookies.get(settings.auth_cookie_name) or bearer_token
    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise unauthorized

    subject = decode_access_token(token)
    if subject is None:
        raise unauthorized
    try:
        user_id = ObjectId(subject)
    except InvalidId:
        raise unauthorized from None

    try:
        user = users.find_one({"_id": user_id})
    except PyMongoError:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="User storage is unavailable.",
        ) from None
    if user is None or not user.get("is_active", False):
        raise unauthorized
    return user