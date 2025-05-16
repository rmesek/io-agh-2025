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
)
from app.models import (
    PromoterProfile,
    PromoterProfileCreate,
    PromoterProfileCreateMe,
    PromoterProfilePublic,
    PromoterProfilesPublic,
    PromoterProfileUpdate,
    UserRoleEnum,
)

router = APIRouter(prefix="/promoter-profiles", tags=["promoter-profiles"])


@router.post(
    "/me",
    response_model=PromoterProfilePublic,
)
def create_promoter_profile_me(
    *,
    session: SessionDep,
    current_user: CurrentUser,
    promoter_profile_in: PromoterProfileCreateMe,
) -> Any:
    """
    Create new promoter profile for the current user.
    """
    if current_user.role != UserRoleEnum.PROMOTER:
        raise HTTPException(
            status_code=400, detail="The user does not have the 'promoter' role"
        )

    promoter_profile = session.get(PromoterProfile, current_user.id)
    if promoter_profile:
        raise HTTPException(
            status_code=409, detail="A promoter profile already exists for this user"
        )
    promoter_profile = crud.create_promoter_profile_me(
        session=session,
        promoter_profile_create=promoter_profile_in,
        user_id=current_user.id,
    )
    return promoter_profile


@router.get(
    "/me",
    response_model=PromoterProfilePublic,
)
def read_promoter_profile_me(
    *,
    current_promoter: CurrentPromoter,
) -> Any:
    """
    Get the current user's promoter profile.
    """
    return current_promoter


@router.patch(
    "/me",
    response_model=PromoterProfilePublic,
)
def update_promoter_profile_me(
    *,
    session: SessionDep,
    promoter_profile_in: PromoterProfileUpdate,
    current_promoter: CurrentPromoter,
) -> Any:
    """
    Update the current user's promoter profile.
    """
    promoter_profile = crud.update_promoter_profile(
        session=session,
        db_promoter_profile=current_promoter,
        promoter_profile_in=promoter_profile_in,
    )
    return promoter_profile


@router.get(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=PromoterProfilesPublic,
)
def read_promoter_profiles(
    *,
    session: SessionDep,
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve promoters.
    """
    count_statement = select(func.count()).select_from(PromoterProfile)
    count = session.exec(count_statement).one()

    statement = select(PromoterProfile).offset(skip).limit(limit)
    promoters = session.exec(statement).all()

    return PromoterProfilesPublic(data=promoters, count=count)  # type: ignore


@router.post(
    "/",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=PromoterProfilePublic,
)
def create_promoter_profile(
    *,
    session: SessionDep,
    promoter_profile_in: PromoterProfileCreate,
) -> Any:
    """
    Create new promoter profile.
    """
    promoter_profile = crud.create_promoter_profile(
        session=session, promoter_profile_create=promoter_profile_in
    )
    return promoter_profile


@router.get(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=PromoterProfilePublic,
)
def read_promoter_profile(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
) -> Any:
    """
    Get promoter profile by user ID.
    """
    promoter_profile = session.get(PromoterProfile, user_id)
    if not promoter_profile:
        raise HTTPException(
            status_code=404, detail="Promoter profile not found for this user ID"
        )
    return promoter_profile


@router.patch(
    "/{user_id}",
    dependencies=[Depends(get_current_active_superuser)],
    response_model=PromoterProfilePublic,
)
def update_promoter_profile(
    *,
    session: SessionDep,
    user_id: uuid.UUID,
    promoter_profile_in: PromoterProfileUpdate,
) -> Any:
    """
    Update a promoter profile.
    """
    promoter_profile = session.get(PromoterProfile, user_id)
    if not promoter_profile:
        raise HTTPException(
            status_code=404, detail="Promoter profile not found for this user ID"
        )
    promoter_profile = crud.update_promoter_profile(
        session=session,
        db_promoter_profile=promoter_profile,
        promoter_profile_in=promoter_profile_in,
    )
    return promoter_profile
