import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    ApplicationStatusEnum,
    StudentProfile,
    ThesisApplication,
    ThesisApplicationCreate,
    ThesisApplicationPublic,
    ThesisApplicationsPublic,
    ThesisApplicationUpdate,
    ThesisTopic,
    ThesisTopicStatusEnum,
    UserRoleEnum,
)

router = APIRouter(prefix="/thesis-applications", tags=["thesis-applications"])


@router.get(
    "/",
    response_model=ThesisApplicationsPublic,
)
def read_thesis_applications(
    *,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    count_statement = select(func.count()).select_from(ThesisApplication)
    count = session.exec(count_statement).one()

    statement = select(ThesisApplication).offset(skip).limit(limit)
    thesis_applications = session.exec(statement).all()

    return ThesisApplicationsPublic(data=thesis_applications, count=count)  # type: ignore


@router.post(
    "/",
    response_model=ThesisApplicationPublic,
)
def create_thesis_application(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    thesis_application_in: ThesisApplicationCreate,
) -> Any:
    student_id: uuid.UUID
    if current_user.is_superuser:
        if not thesis_application_in.student_id:
            raise HTTPException(
                status_code=400,
                detail="Student ID must be provided for superuser.",
            )
        student_id = thesis_application_in.student_id
    elif current_user.role == UserRoleEnum.STUDENT:
        student_id = current_user.id
    else:
        raise HTTPException(
            status_code=403,
            detail="Not enough permissions to create a thesis application.",
        )

    student_profile = session.exec(
        select(StudentProfile).where(StudentProfile.user_id == student_id)
    ).first()
    if not student_profile:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found.",
        )
    thesis_topic = session.get(ThesisTopic, thesis_application_in.thesis_topic_id)
    if not thesis_topic:
        raise HTTPException(
            status_code=404,
            detail="Thesis topic not found.",
        )
    if (
        thesis_topic.status != ThesisTopicStatusEnum.OPEN
        or thesis_topic.slots_available <= 0
    ):
        raise HTTPException(
            status_code=400,
            detail="Thesis topic is not available for application.",
        )
    existing_application = session.exec(
        select(ThesisApplication).where(
            ThesisApplication.student_id == student_id,
            ThesisApplication.thesis_topic_id == thesis_application_in.thesis_topic_id,
        )
    ).first()
    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="An application for this student and thesis topic already exists.",
        )

    thesis_application = ThesisApplication.model_validate(
        thesis_application_in,
        update={
            "student_id": student_profile.user_id,
            "promoter_id": thesis_topic.promoter_id,
        },
    )

    session.add(thesis_application)
    session.commit()
    session.refresh(thesis_application)
    return thesis_application


@router.get(
    "/{application_id}",
    response_model=ThesisApplicationPublic,
)
def read_thesis_application(
    *,
    application_id: uuid.UUID,
    session: SessionDep,
) -> Any:
    application = session.get(ThesisApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Thesis application not found")
    return application


@router.patch(
    "/{application_id}",
    response_model=ThesisApplicationPublic,
)
def update_thesis_application(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    application_id: uuid.UUID,
    application_in: ThesisApplicationUpdate,
) -> Any:
    application = session.get(ThesisApplication, application_id)
    if not application:
        raise HTTPException(status_code=404, detail="Thesis application not found")

    allowed_to_update = False
    if current_user.is_superuser:
        allowed_to_update = True
    elif application_in.status == ApplicationStatusEnum.CANCELED_BY_STUDENT:
        if application.student_id == current_user.id:
            allowed_to_update = True
    elif application_in.status in [
        ApplicationStatusEnum.APPROVED_BY_PROMOTER,
        ApplicationStatusEnum.REJECTED_BY_PROMOTER,
    ]:
        if (
            application.promoter_id == current_user.id
            and current_user.role == UserRoleEnum.PROMOTER
        ):
            allowed_to_update = True

    if not allowed_to_update:
        raise HTTPException(status_code=403, detail="Not enough permissions")

    application_data = application_in.model_dump(exclude_unset=True)
    application_data["resolution_date"] = datetime.now(timezone.utc)

    for key, value in application_data.items():
        setattr(application, key, value)

    session.add(application)
    session.commit()
    session.refresh(application)
    return application
