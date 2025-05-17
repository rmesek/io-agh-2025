from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app import crud
from app.api.deps import (
    CurrentPromoter,
    CurrentStudent,
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
)
from app.models import (
    ApplicationStatusEnum,
    StudentProfile,
    StudyStageEnum,
    ThesisApplication,
    ThesisApplicationCreate,
    ThesisApplicationCreateStudent,
    ThesisApplicationPublic,
    ThesisApplicationsPublic,
    ThesisApplicationUpdate,
    ThesisApplicationUpdatePromoter,
    ThesisApplicationUpdateStudent,
    ThesisTopic,
    ThesisTopicStatusEnum,
)

router = APIRouter(prefix="/thesis-applications", tags=["thesis-applications"])


@router.get(
    "/student",
    response_model=ThesisApplicationsPublic,
)
def read_thesis_applications_student(
    *,
    session: SessionDep,
    current_student: CurrentStudent,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve thesis applications for the current student.
    """
    count_statement = (
        select(func.count())
        .select_from(ThesisApplication)
        .where(ThesisApplication.student_id == current_student.user_id)
    )
    count = session.exec(count_statement).one()

    statement = (
        select(ThesisApplication)
        .where(ThesisApplication.student_id == current_student.user_id)
        .offset(skip)
        .limit(limit)
    )
    thesis_applications = session.exec(statement).all()

    return ThesisApplicationsPublic(data=thesis_applications, count=count)  # type: ignore


@router.post(
    "/student",
    response_model=ThesisApplicationPublic,
)
def create_thesis_application_student(
    *,
    session: SessionDep,
    current_student: CurrentStudent,
    thesis_application_in: ThesisApplicationCreateStudent,
) -> Any:
    """
    Create new thesis application for the current student.
    """
    exisiting_application = crud.get_thesis_application_by_topic_and_student(
        session=session,
        topic_id=thesis_application_in.thesis_topic_id,
        student_id=current_student.user_id,
    )
    if exisiting_application:
        raise HTTPException(
            status_code=400,
            detail="The thesis application with this topic already exists for the current user",
        )
    # this part is not tested well
    thesis_topic = crud.get_thesis_topic_by_id(
        session=session, topic_id=thesis_application_in.thesis_topic_id
    )
    if not thesis_topic:
        raise HTTPException(
            status_code=404,
            detail="The thesis topic with this id does not exist",
        )
    if thesis_topic.status != ThesisTopicStatusEnum.OPEN:
        raise HTTPException(
            status_code=400,
            detail="The thesis topic is not open for applications",
        )
    if thesis_topic.slots_available <= 0:
        raise HTTPException(
            status_code=400,
            detail="The thesis topic has no available slots",
        )
    if (
        thesis_topic.target_study_stage != StudyStageEnum.ANY
        and thesis_topic.target_study_stage != current_student.study_stage
    ):
        raise HTTPException(
            status_code=400,
            detail="The thesis topic is not suitable for the current study stage",
        )

    thesis_application = crud.create_thesis_application_student(
        session=session,
        thesis_application_create=thesis_application_in,
        user_id=current_student.user_id,
    )
    return thesis_application


@router.get("/promoter", response_model=ThesisApplicationsPublic)
def read_thesis_applications_promoter(
    *,
    session: SessionDep,
    current_promoter: CurrentPromoter,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve thesis applications for the current promoter.
    """
    count_statement = (
        select(func.count())
        .select_from(ThesisApplication)
        .join(ThesisTopic)
        .where(ThesisTopic.promoter_id == current_promoter.user_id)
    )
    count = session.exec(count_statement).one()

    statement = (
        select(ThesisApplication)
        .join(ThesisTopic)
        .where(ThesisTopic.promoter_id == current_promoter.user_id)
        .offset(skip)
        .limit(limit)
    )
    thesis_applications = session.exec(statement).all()

    return ThesisApplicationsPublic(data=thesis_applications, count=count)  # type: ignore


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ThesisApplicationsPublic,
)
def read_thesis_applications(
    *,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve thesis applications.
    """
    count_statement = select(func.count()).select_from(ThesisApplication)
    count = session.exec(count_statement).one()

    statement = select(ThesisApplication).offset(skip).limit(limit)
    thesis_applications = session.exec(statement).all()

    return ThesisApplicationsPublic(data=thesis_applications, count=count)  # type: ignore


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ThesisApplicationPublic,
)
def create_thesis_application(
    *,
    session: SessionDep,
    thesis_application_in: ThesisApplicationCreate,
) -> Any:
    """
    Create new thesis application.
    """
    thesis_topic = crud.get_thesis_topic_by_id(
        session=session, topic_id=thesis_application_in.thesis_topic_id
    )
    if not thesis_topic:
        raise HTTPException(
            status_code=404,
            detail="The thesis topic with this id does not exist",
        )
    student = session.get(StudentProfile, thesis_application_in.student_id)
    if not student:
        raise HTTPException(
            status_code=404,
            detail="The student profile with this id does not exist",
        )
    exisiting_application = crud.get_thesis_application_by_topic_and_student(
        session=session,
        topic_id=thesis_application_in.thesis_topic_id,
        student_id=thesis_application_in.student_id,
    )
    if exisiting_application:
        raise HTTPException(
            status_code=400,
            detail="The thesis application with this topic already exists for the current user",
        )
    thesis_application = crud.create_thesis_application(
        session=session,
        thesis_application_create=thesis_application_in,
    )
    return thesis_application


@router.patch(
    "/{id}/student",
    response_model=ThesisApplicationPublic,
)
def update_thesis_application_student(
    *,
    session: SessionDep,
    current_student: CurrentStudent,
    application_id: str,
    thesis_application_in: ThesisApplicationUpdateStudent,
) -> Any:
    """
    Update thesis application by ID for the current student.
    """
    thesis_application = session.get(ThesisApplication, application_id)
    if not thesis_application:
        raise HTTPException(
            status_code=404,
            detail="The thesis application with this id does not exist",
        )
    if thesis_application.student_id != current_student.user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this thesis application",
        )

    thesis_topic = session.get(ThesisTopic, thesis_application.thesis_topic_id)
    if not thesis_topic:
        raise HTTPException(
            status_code=404,
            detail="The thesis topic with this id does not exist",
        )

    if (
        not thesis_application_in.status == ApplicationStatusEnum.CANCELED_BY_STUDENT
        and not thesis_application_in.status == ApplicationStatusEnum.PENDING_APPROVAL
    ):
        raise HTTPException(
            status_code=400,
            detail="You can only update the status to "
            "CANCELED_BY_STUDENT or PENDING_APPROVAL",
        )

    # this part is not tested well
    if thesis_application.status == ApplicationStatusEnum.APPROVED_BY_PROMOTER:
        thesis_topic.slots_available = min(
            thesis_topic.slots_total, thesis_topic.slots_available + 1
        )
        session.add(thesis_topic)

    thesis_application_data = thesis_application_in.model_dump(exclude_unset=True)
    db_thesis_application = thesis_application.sqlmodel_update(thesis_application_data)
    session.add(db_thesis_application)
    session.commit()
    session.refresh(db_thesis_application)
    return db_thesis_application


@router.patch(
    "/{id}/promoter",
    response_model=ThesisApplicationPublic,
)
def update_thesis_application_promoter(
    *,
    session: SessionDep,
    current_promoter: CurrentPromoter,
    application_id: str,
    thesis_application_in: ThesisApplicationUpdatePromoter,
) -> Any:  # TODO: check ThesisTopic and ThesisApplication status and slots availability
    """
    Update thesis application by ID for the current promoter.
    """
    thesis_application = session.get(ThesisApplication, application_id)
    if not thesis_application:
        raise HTTPException(
            status_code=404,
            detail="The thesis application with this id does not exist",
        )
    if thesis_application.thesis_topic.promoter_id != current_promoter.user_id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this thesis application",
        )

    thesis_topic = session.get(ThesisTopic, thesis_application.thesis_topic_id)
    if not thesis_topic:
        raise HTTPException(
            status_code=404,
            detail="The thesis topic with this id does not exist",
        )

    # this part is not tested well
    if thesis_application.status == ApplicationStatusEnum.CANCELED_BY_STUDENT:
        raise HTTPException(
            status_code=400,
            detail="The thesis topic is canceled by student",
        )

    if (
        not thesis_application_in.status == ApplicationStatusEnum.PENDING_APPROVAL
        and not thesis_application_in.status
        == ApplicationStatusEnum.APPROVED_BY_PROMOTER
        and not thesis_application_in.status
        == ApplicationStatusEnum.REJECTED_BY_PROMOTER
    ):
        raise HTTPException(
            status_code=400,
            detail="You can only update the status to "
            "PENDING_APPROVAL, APPROVED_BY_PROMOTER or REJECTED_BY_PROMOTER",
        )

    if (
        thesis_application.status == ApplicationStatusEnum.APPROVED_BY_PROMOTER
        and thesis_application_in.status != ApplicationStatusEnum.APPROVED_BY_PROMOTER
    ):
        thesis_topic.slots_available = min(
            thesis_topic.slots_total, thesis_topic.slots_available + 1
        )
        session.add(thesis_topic)
    elif (
        thesis_application.status != ApplicationStatusEnum.APPROVED_BY_PROMOTER
        and thesis_application_in.status == ApplicationStatusEnum.APPROVED_BY_PROMOTER
    ):
        if thesis_topic.slots_available <= 0:
            raise HTTPException(
                status_code=400,
                detail="The thesis topic has no available slots",
            )
        thesis_topic.slots_available = max(0, thesis_topic.slots_available - 1)
        session.add(thesis_topic)

    thesis_application_data = thesis_application_in.model_dump(exclude_unset=True)
    db_thesis_application = thesis_application.sqlmodel_update(thesis_application_data)
    session.add(db_thesis_application)
    session.commit()
    session.refresh(db_thesis_application)
    return db_thesis_application


@router.get(
    "/{id}",
    response_model=ThesisApplicationPublic,
)
def read_thesis_application(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    application_id: str,
) -> Any:
    """
    Retrieve thesis application by ID.
    """
    thesis_application = session.get(ThesisApplication, application_id)
    if not thesis_application:
        raise HTTPException(
            status_code=404,
            detail="The thesis application with this id does not exist",
        )
    if (
        not current_user.is_superuser
        and not current_user.id == thesis_application.student_id
        and not current_user.id == thesis_application.thesis_topic.promoter_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this thesis application",
        )
    return thesis_application


@router.delete(
    "/{id}",
    response_model=ThesisApplicationPublic,
)
def delete_thesis_application(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    application_id: str,
) -> Any:
    """
    Delete thesis application by ID.
    """
    thesis_application = session.get(ThesisApplication, application_id)
    if not thesis_application:
        raise HTTPException(
            status_code=404,
            detail="The thesis application with this id does not exist",
        )
    if (
        not current_user.is_superuser
        and not current_user.id == thesis_application.student_id
        and not current_user.id == thesis_application.thesis_topic.promoter_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to access this thesis application",
        )
    if thesis_application.status == ApplicationStatusEnum.APPROVED_BY_PROMOTER:
        thesis_topic = session.get(ThesisTopic, thesis_application.thesis_topic_id)
        if not thesis_topic:
            raise HTTPException(
                status_code=404,
                detail="The thesis topic with this id does not exist",
            )
        thesis_topic.slots_available = min(
            thesis_topic.slots_total, thesis_topic.slots_available + 1
        )
        session.add(thesis_topic)
    session.delete(thesis_application)
    session.commit()
    return thesis_application


@router.patch(
    "/{id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ThesisApplicationPublic,
)
def update_thesis_application(
    *,
    session: SessionDep,
    application_id: str,
    thesis_application_in: ThesisApplicationUpdate,
) -> Any:
    """
    Update thesis application by ID.
    """
    thesis_application = session.get(ThesisApplication, application_id)
    if not thesis_application:
        raise HTTPException(
            status_code=404,
            detail="The thesis application with this id does not exist",
        )
    db_thesis_application = crud.update_thesis_application(
        session=session,
        db_thesis_application=thesis_application,
        thesis_application_in=thesis_application_in,
    )
    return db_thesis_application
