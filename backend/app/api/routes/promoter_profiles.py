import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from sqlmodel import func, select

from app import crud
from app.api.deps import SessionDep
from app.models import (
    PromoterProfile,
    PromoterProfileCreate,
    PromoterProfilePublic,
    PromoterProfilesPublic,
    User,
    UserRoleEnum,
)

router = APIRouter(prefix="/promoter-profiles", tags=["promoter-profiles"])


@router.get("/", response_model=PromoterProfilesPublic)
def read_promoter_profiles(
    *, session: SessionDep, skip: int = 0, limit: int = 100
) -> Any:
    """
    Retrieve promoters.
    """

    count_statement = select(func.count()).select_from(PromoterProfile)
    count = session.exec(count_statement).one()

    statement = select(PromoterProfile).offset(skip).limit(limit)
    promoters = session.exec(statement).all()

    return PromoterProfilesPublic(data=promoters, count=count)  # type: ignore


@router.post("/", response_model=PromoterProfilePublic)
def create_promoter_profile(
    *, session: SessionDep, promoter_profile_in: PromoterProfileCreate
):
    """
    Create new promoter profile.
    The user associated with user_id must exist and have the 'promoter' role.
    """
    user = session.get(User, promoter_profile_in.user_id)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this ID does not exist in the system.",
        )
    if user.role != UserRoleEnum.PROMOTER:
        raise HTTPException(
            status_code=400, detail="The user does not have the 'promoter' role."
        )

    # check if a promoter profile already exists for this user
    existing_profile = session.exec(
        select(PromoterProfile).where(
            PromoterProfile.user_id == promoter_profile_in.user_id
        )
    ).first()
    if existing_profile:
        raise HTTPException(
            status_code=409, detail="A promoter profile already exists for this user."
        )

    promoter_profile = crud.create_promoter_profile(
        session=session, promoter_profile_create=promoter_profile_in
    )
    return promoter_profile


@router.get("/{user_id}", response_model=PromoterProfilePublic)
def read_promoter_profile(user_id: uuid.UUID, session: SessionDep):
    """
    Get promoter profile by user ID.
    """
    promoter_profile = session.get(PromoterProfile, user_id)
    if not promoter_profile:
        raise HTTPException(
            status_code=404, detail="Promoter profile not found for this user ID."
        )
    return promoter_profile
