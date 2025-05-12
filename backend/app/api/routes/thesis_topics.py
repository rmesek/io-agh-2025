import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app.api.deps import CurrentUser, SessionDep
from app.models import (
    PromoterProfile,
    ThesisTopic,
    ThesisTopicCreate,
    ThesisTopicPublic,
    ThesisTopicsPublic,
    UserRoleEnum,
)

router = APIRouter(prefix="/thesis-topics", tags=["thesis-topics"])


@router.get(
    "/",
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

    return ThesisTopicsPublic(data=thesis_topics, count=count)  # type: ignore


@router.post(
    "/",
    response_model=ThesisTopicPublic,
)
def create_thesis_topic(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    thesis_topic_in: ThesisTopicCreate,
) -> Any:
    """
    Create new thesis topic.
    """
    promoter_id: uuid.UUID
    if current_user.is_superuser:
        if not thesis_topic_in.promoter_id:
            raise HTTPException(
                status_code=400,
                detail="Promoter ID must be provided for superuser.",
            )
        promoter = session.get(PromoterProfile, thesis_topic_in.promoter_id)
        if not promoter:
            raise HTTPException(
                status_code=404,
                detail="Promoter not found.",
            )
        promoter_id = thesis_topic_in.promoter_id
    elif current_user.role == UserRoleEnum.PROMOTER:
        promoter_id = current_user.id
    else:
        raise HTTPException(
            status_code=403,
            detail="Only superuser or promoter can create thesis topics.",
        )

    promoter_profile = session.exec(
        select(PromoterProfile).where(PromoterProfile.user_id == promoter_id)
    ).first()
    if not promoter_profile:
        raise HTTPException(
            status_code=403,
            detail="Promoter profile not found.",
        )
    thesis_topic = ThesisTopic.model_validate(
        thesis_topic_in, update={"promoter_id": promoter_profile.user_id}
    )
    session.add(thesis_topic)
    session.commit()
    session.refresh(thesis_topic)
    return thesis_topic


@router.get(
    "/{topic_id}",
    response_model=ThesisTopicPublic,
)
def read_thesis_topic(
    *,
    topic_id: uuid.UUID,
    session: SessionDep,
) -> Any:
    """
    Get thesis topic by ID.
    """
    thesis_topic = session.get(ThesisTopic, topic_id)
    if not thesis_topic:
        raise HTTPException(status_code=404, detail="Thesis topic not found")
    return thesis_topic
