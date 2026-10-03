from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pymongo.collection import Collection

from app.api.dependencies import get_current_user, get_users_collection
from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.security import create_access_token
from app.schemas.auth import LoginRequest, LogoutResponse, RegisterRequest, UserResponse
from app.services.auth_service import authenticate_user, public_user, register_user

router = APIRouter(prefix="/auth", tags=["authentication"])
Users = Annotated[Collection, Depends(get_users_collection)]


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(request: Request, payload: RegisterRequest, users: Users) -> UserResponse:
    return register_user(users, payload)


@router.post("/login", response_model=UserResponse)
@limiter.limit("10/minute")
def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    users: Users,
) -> UserResponse:
    user = authenticate_user(users, payload)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(str(user["_id"]))
    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        max_age=settings.jwt_access_token_minutes * 60,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        path="/api",
    )
    return public_user(user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: Annotated[dict, Depends(get_current_user)]) -> UserResponse:
    return public_user(current_user)


@router.post("/logout", response_model=LogoutResponse)
def logout(response: Response) -> LogoutResponse:
    response.delete_cookie(
        key=settings.auth_cookie_name,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        path="/api",
    )
    return LogoutResponse(status="ok")