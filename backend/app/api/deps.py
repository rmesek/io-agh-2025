from collections.abc import Generator
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import PromoterProfile, StudentProfile, TokenPayload, User, UserRoleEnum

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
TokenDep = Annotated[str, Depends(reusable_oauth2)]


def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def get_current_active_superuser(current_user: CurrentUser) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=403, detail="The user doesn't have enough privileges"
        )
    return current_user


def get_current_active_student(
    session: SessionDep, current_user: CurrentUser
) -> StudentProfile:
    if current_user.role != UserRoleEnum.STUDENT:
        raise HTTPException(status_code=403, detail="User is not a student")
    student_profile = session.get(StudentProfile, current_user.id)
    if not student_profile:
        raise HTTPException(status_code=404, detail="Student profile is not set")
    return student_profile


CurrentStudent = Annotated[StudentProfile, Depends(get_current_active_student)]


def get_current_active_promoter(
    session: SessionDep, current_user: CurrentUser
) -> PromoterProfile:
    if current_user.role != UserRoleEnum.PROMOTER:
        raise HTTPException(status_code=403, detail="User is not a promoter")
    promoter_profile = session.get(PromoterProfile, current_user.id)
    if not promoter_profile:
        raise HTTPException(status_code=404, detail="Promoter profile is not set")
    return promoter_profile


CurrentPromoter = Annotated[PromoterProfile, Depends(get_current_active_promoter)]
