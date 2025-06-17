import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import func, select

from app import crud
from app.api.deps import (
    CurrentPromoter,
    CurrentUser,
    SessionDep,
    get_current_active_superuser,
    get_current_user,
)
from app.models import (
    Message,
    PromoterProfile,
    StudyStageEnum,
    ThesisTopic,
    ThesisTopicCreate,
    ThesisTopicCreateMe,
    ThesisTopicPublic,
    ThesisTopicsPublic,
    ThesisTopicUpdate,
)

router = APIRouter(prefix="/thesis-topics", tags=["thesis-topics"])

# TODO: student limit per promoter is not implemented yet


@router.get(
    "/me",
    response_model=ThesisTopicsPublic,
)
def read_thesis_topics_me(
    *,
    session: SessionDep,
    current_promoter: CurrentPromoter,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve thesis topics.
    """
    count_statement = (
        select(func.count())
        .select_from(ThesisTopic)
        .where(ThesisTopic.promoter_id == current_promoter.user_id)
    )
    count = session.exec(count_statement).one()

    statement = (
        select(ThesisTopic)
        .where(ThesisTopic.promoter_id == current_promoter.user_id)
        .offset(skip)
        .limit(limit)
    )
    thesis_topics = session.exec(statement).all()
    thesis_topics_public = [
        ThesisTopicPublic.model_validate(thesis_topic) for thesis_topic in thesis_topics
    ]

    return ThesisTopicsPublic(data=thesis_topics_public, count=count)


@router.post(
    "/me",
    response_model=ThesisTopicPublic,
)
def create_thesis_topic_me(
    *,
    session: SessionDep,
    current_promoter: CurrentPromoter,
    thesis_topic_in: ThesisTopicCreateMe,
) -> Any:
    """
    Create new thesis topic for the current user.
    """
    existing_topic = crud.get_thesis_topic_by_title_and_promoter(
        session=session,
        title=thesis_topic_in.title,
        promoter_id=current_promoter.user_id,
    )
    if existing_topic:
        raise HTTPException(
            status_code=400,
            detail="The thesis topic with this title already exists for the current user",
        )
    if (
        thesis_topic_in.target_study_stage == StudyStageEnum.MASTER
        and not current_promoter.can_supervise_master
    ):
        raise HTTPException(
            status_code=400,
            detail="The current user cannot supervise master thesis topics",
        )
    if (
        thesis_topic_in.target_study_stage == StudyStageEnum.BACHELOR
        and not current_promoter.can_supervise_bachelor
    ):
        raise HTTPException(
            status_code=400,
            detail="The current user cannot supervise bachelor thesis topics",
        )
    thesis_topic = crud.create_thesis_topic_me(
        session=session,
        thesis_topic_create=thesis_topic_in,
        user_id=current_promoter.user_id,
    )
    return thesis_topic


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=ThesisTopicPublic,
)
def create_thesis_topic(
    *,
    session: SessionDep,
    thesis_topic_in: ThesisTopicCreate,
) -> Any:
    """
    Create new thesis topic.
    """
    existing_topic = crud.get_thesis_topic_by_title_and_promoter(
        session=session,
        title=thesis_topic_in.title,
        promoter_id=thesis_topic_in.promoter_id,
    )
    if existing_topic:
        raise HTTPException(
            status_code=400,
            detail="The thesis topic with this title already exists for the current user",
        )
    promoter_profile = session.get(PromoterProfile, thesis_topic_in.promoter_id)
    if not promoter_profile:
        raise HTTPException(
            status_code=400,
            detail="The promoter profile does not exist for this user ID",
        )
    thesis_topic = crud.create_thesis_topic(
        session=session, thesis_topic_create=thesis_topic_in
    )
    return thesis_topic


@router.get(
    "/",
    dependencies=[Depends(get_current_user)],
    response_model=ThesisTopicsPublic,
)
def read_thesis_topics(
    *,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve thesis topics.
    """
    count_statement = select(func.count()).select_from(ThesisTopic)
    count = session.exec(count_statement).one()

    statement = select(ThesisTopic).offset(skip).limit(limit)
    thesis_topics = session.exec(statement).all()
    thesis_topics_public = [
        ThesisTopicPublic.model_validate(thesis_topic) for thesis_topic in thesis_topics
    ]

    return ThesisTopicsPublic(data=thesis_topics_public, count=count)


@router.get(
    "/{id}",
    dependencies=[Depends(get_current_user)],
    response_model=ThesisTopicPublic,
)
def read_thesis_topic(
    *,
    session: SessionDep,
    id: uuid.UUID,
) -> Any:
    """
    Get thesis topic by ID.
    """
    thesis_topic = session.get(ThesisTopic, id)
    if not thesis_topic:
        raise HTTPException(status_code=404, detail="Thesis topic not found")
    return thesis_topic


@router.patch(
    "/{id}",
    response_model=ThesisTopicPublic,
)
def update_thesis_topic(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
    thesis_topic_in: ThesisTopicUpdate,
) -> Any:
    """
    Update a thesis topic.
    """
    thesis_topic = session.get(ThesisTopic, id)
    if not thesis_topic:
        raise HTTPException(status_code=404, detail="Thesis topic not found")
    if not current_user.is_superuser and (current_user.id != thesis_topic.promoter_id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    if not current_user.is_superuser:
        if (
            thesis_topic_in.target_study_stage == StudyStageEnum.MASTER
            and not current_user.promoter_profile.can_supervise_master
        ):
            raise HTTPException(
                status_code=400,
                detail="The current user cannot supervise master thesis topics",
            )
        if (
            thesis_topic_in.target_study_stage == StudyStageEnum.BACHELOR
            and not current_user.promoter_profile.can_supervise_bachelor
        ):
            raise HTTPException(
                status_code=400,
                detail="The current user cannot supervise bachelor thesis topics",
            )
    db_thesis_topic = crud.update_thesis_topic(
        session=session, db_thesis_topic=thesis_topic, thesis_topic_in=thesis_topic_in
    )
    return db_thesis_topic


@router.delete(
    "/{id}",
    response_model=Message,
)
def delete_thesis_topic(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    id: uuid.UUID,
) -> Any:
    """
    Delete a thesis topic.
    """
    thesis_topic = session.get(ThesisTopic, id)
    if not thesis_topic:
        raise HTTPException(status_code=404, detail="Thesis topic not found")
    if not current_user.is_superuser and (current_user.id != thesis_topic.promoter_id):
        raise HTTPException(status_code=400, detail="Not enough permissions")
    session.delete(thesis_topic)
    session.commit()
    return Message(message="Thesis topic deleted successfully")
