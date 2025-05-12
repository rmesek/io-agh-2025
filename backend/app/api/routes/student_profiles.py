import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import SessionDep
from app.models import (
    StudentProfile,
    StudentProfileCreate,
    StudentProfilePublic,
    StudentProfilesPublic,
    User,
)

router = APIRouter(prefix="/student-profiles", tags=["student-profiles"])


@router.get(
    "/",
    response_model=StudentProfilesPublic,
)
def read_student_profiles(
    *,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    count_statement = select(func.count()).select_from(StudentProfile)
    count = session.exec(count_statement).one()

    statement = select(StudentProfile).offset(skip).limit(limit)
    student_profiles = session.exec(statement).all()

    return StudentProfilesPublic(data=student_profiles, count=count)  # type: ignore


@router.post(
    "/",
    response_model=StudentProfilePublic,
)
def create_student_profile(
    *,
    session: SessionDep,
    student_profile_in: StudentProfileCreate,
) -> Any:
    user = session.get(User, student_profile_in.user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this ID does not exist in the system.",
        )

    existing_profile = session.exec(
        select(StudentProfile).where(
            StudentProfile.user_id == student_profile_in.user_id
        )
    ).first()
    if existing_profile:
        raise HTTPException(
            status_code=409,
            detail="A student profile already exists for this user.",
        )

    student_profile = StudentProfile.model_validate(student_profile_in)
    session.add(student_profile)
    session.commit()
    session.refresh(student_profile)
    return student_profile


@router.get(
    "/{user_id}",
    response_model=StudentProfilePublic,
)
def read_student_profile(
    *,
    user_id: uuid.UUID,
    session: SessionDep,
) -> Any:
    student_profile = session.get(StudentProfile, user_id)
    if not student_profile:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found for this user ID.",
        )
    return student_profile
