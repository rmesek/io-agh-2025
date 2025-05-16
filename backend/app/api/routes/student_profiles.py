import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app import crud
from app.api.deps import (
    CurrentStudent,
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.models import (
    StudentProfile,
    StudentProfileCreate,
    StudentProfileCreateMe,
    StudentProfilePublic,
    StudentProfilesPublic,
    StudentProfileUpdate,
    UserRoleEnum,
)

router = APIRouter(prefix="/student-profiles", tags=["student-profiles"])


@router.post(
    "/me",
    response_model=StudentProfilePublic,
)
def create_student_profile_me(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    student_profile_in: StudentProfileCreateMe,
) -> Any:
    """
    Create new student profile for the current user.
    """
    if current_user.role != UserRoleEnum.STUDENT:
        raise HTTPException(
            status_code=400, detail="The user does not have the 'student' role"
        )

    student_profile = session.get(StudentProfile, current_user.id)
    if student_profile:
        raise HTTPException(
            status_code=409, detail="A student profile already exists for this user"
        )
    student_profile = crud.create_student_profile_me(
        session=session,
        student_profile_create=student_profile_in,
        user_id=current_user.id,
    )
    return student_profile


@router.get(
    "/me",
    response_model=StudentProfilePublic,
)
def read_student_profile_me(
    *,
    current_student: CurrentStudent,
) -> Any:
    """
    Get the current user's student profile.
    """
    return current_student


@router.patch(
    "/me",
    response_model=StudentProfilePublic,
)
def update_student_profile_me(
    *,
    session: SessionDep,
    student_profile_in: StudentProfileUpdate,
    current_student: CurrentStudent,
) -> Any:
    """
    Update the current user's student profile.
    """
    student_profile = crud.update_student_profile(
        session=session,
        db_student_profile=current_student,
        student_profile_in=student_profile_in,
    )
    return student_profile


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=StudentProfilesPublic,
)
def read_student_profiles(
    *,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve students.
    """
    count_statement = select(func.count()).select_from(StudentProfile)
    count = session.exec(count_statement).one()

    statement = select(StudentProfile).offset(skip).limit(limit)
    students = session.exec(statement).all()

    return StudentProfilesPublic(data=students, count=count)  # type: ignore


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=StudentProfilePublic,
)
def create_student_profile(
    *,
    session: SessionDep,
    student_profile_in: StudentProfileCreate,
) -> Any:
    """
    Create new student profile.
    """
    student_profile = crud.create_student_profile(
        session=session, student_profile_create=student_profile_in
    )
    return student_profile


@router.get(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=StudentProfilePublic,
)
def read_student_profile(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
) -> Any:
    """
    Get a student profile by user ID.
    """
    student_profile = session.get(StudentProfile, user_id)
    if not student_profile:
        raise HTTPException(
            status_code=404, detail="Student profile not found for this user ID"
        )
    return student_profile


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=StudentProfilePublic,
)
def update_student_profile(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    student_profile_in: StudentProfileUpdate,
) -> Any:
    """
    Update a student profile.
    """
    student_profile = session.get(StudentProfile, user_id)
    if not student_profile:
        raise HTTPException(
            status_code=404, detail="Student profile not found for this user ID"
        )
    student_profile = crud.update_student_profile(
        session=session,
        db_student_profile=student_profile,
        student_profile_in=student_profile_in,
    )
    return student_profile
