import uuid
from typing import Any

from sqlmodel import Session, select

from app.core.security import get_password_hash, verify_password
from app.models import (
    Item,
    ItemCreate,
    PromoterProfile,
    PromoterProfileCreate,
    PromoterProfileCreateMe,
    PromoterProfileUpdate,
    StudentProfile,
    StudentProfileCreate,
    StudentProfileCreateMe,
    StudentProfileUpdate,
    ThesisApplication,
    ThesisApplicationCreate,
    ThesisApplicationCreateStudent,
    ThesisApplicationUpdate,
    ThesisApplicationUpdatePromoter,
    ThesisTopic,
    ThesisTopicCreate,
    ThesisTopicCreateMe,
    ThesisTopicUpdate,
    User,
    UserCreate,
    UserUpdate,
)


def create_user(*, session: Session, user_create: UserCreate) -> User:
    db_obj = User.model_validate(
        user_create, update={"hashed_password": get_password_hash(user_create.password)}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_user(*, session: Session, db_user: User, user_in: UserUpdate) -> Any:
    user_data = user_in.model_dump(exclude_unset=True)
    extra_data = {}
    if "password" in user_data:
        password = user_data["password"]
        hashed_password = get_password_hash(password)
        extra_data["hashed_password"] = hashed_password
    db_user.sqlmodel_update(user_data, update=extra_data)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


def get_user_by_email(*, session: Session, email: str) -> User | None:
    statement = select(User).where(User.email == email)
    session_user = session.exec(statement).first()
    return session_user


def authenticate(*, session: Session, email: str, password: str) -> User | None:
    db_user = get_user_by_email(session=session, email=email)
    if not db_user:
        return None
    if not verify_password(password, db_user.hashed_password):
        return None
    return db_user


def create_item(*, session: Session, item_in: ItemCreate, owner_id: uuid.UUID) -> Item:
    db_item = Item.model_validate(item_in, update={"owner_id": owner_id})
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


def create_promoter_profile(
    *, session: Session, promoter_profile_create: PromoterProfileCreate
) -> PromoterProfile:
    db_obj = PromoterProfile.model_validate(promoter_profile_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def create_promoter_profile_me(
    *,
    session: Session,
    promoter_profile_create: PromoterProfileCreateMe,
    user_id: uuid.UUID,
) -> PromoterProfile:
    db_obj = PromoterProfile.model_validate(
        promoter_profile_create, update={"user_id": user_id}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_promoter_profile(
    *,
    session: Session,
    db_promoter_profile: PromoterProfile,
    promoter_profile_in: PromoterProfileUpdate,
) -> Any:
    promoter_profile_data = promoter_profile_in.model_dump(exclude_unset=True)
    db_promoter_profile.sqlmodel_update(promoter_profile_data)
    session.add(db_promoter_profile)
    session.commit()
    session.refresh(db_promoter_profile)
    return db_promoter_profile


def create_student_profile(
    *, session: Session, student_profile_create: StudentProfileCreate
) -> StudentProfile:
    db_obj = StudentProfile.model_validate(student_profile_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def create_student_profile_me(
    *,
    session: Session,
    student_profile_create: StudentProfileCreateMe,
    user_id: uuid.UUID,
) -> StudentProfile:
    db_obj = StudentProfile.model_validate(
        student_profile_create, update={"user_id": user_id}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_student_profile(
    *,
    session: Session,
    db_student_profile: StudentProfile,
    student_profile_in: StudentProfileUpdate,
) -> Any:
    student_profile_data = student_profile_in.model_dump(exclude_unset=True)
    db_student_profile.sqlmodel_update(student_profile_data)
    session.add(db_student_profile)
    session.commit()
    session.refresh(db_student_profile)
    return db_student_profile


# def create_user_with_profile(*, session: Session, user_create: UserCreate) -> User:
#     db_user = User.model_validate(
#         user_create, update={"hashed_password": get_password_hash(user_create.password)}
#     )
#     session.add(db_user)
#     session.commit()
#     session.refresh(db_user)

#     if db_user.role == UserRoleEnum.PROMOTER:
#         profile_create = PromoterProfileCreate(user_id=db_user.id)
#         create_promoter_profile(session=session, promoter_profile_create=profile_create)
#     elif db_user.role == UserRoleEnum.STUDENT:
#         profile_create = PromoterProfileCreate(user_id=db_user.id)
#         create_student_profile(session=session, student_profile_create=profile_create)

#     session.refresh(db_user)
#     return db_user


def create_thesis_topic(
    *, session: Session, thesis_topic_create: ThesisTopicCreate
) -> ThesisTopic:
    db_obj = ThesisTopic.model_validate(thesis_topic_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def get_thesis_topic_by_id(
    *, session: Session, topic_id: uuid.UUID
) -> ThesisTopic | None:
    existing_topic = session.get(ThesisTopic, topic_id)
    return existing_topic


def get_thesis_topic_by_title_and_promoter(
    *,
    session: Session,
    title: str,
    promoter_id: uuid.UUID,
) -> ThesisTopic | None:
    existing_topic = session.exec(
        select(ThesisTopic).where(
            ThesisTopic.title == title,
            ThesisTopic.promoter_id == promoter_id,
        )
    ).first()
    return existing_topic


def create_thesis_topic_me(
    *,
    session: Session,
    thesis_topic_create: ThesisTopicCreateMe,
    user_id: uuid.UUID,
) -> ThesisTopic:
    db_obj = ThesisTopic.model_validate(
        thesis_topic_create, update={"promoter_id": user_id}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_thesis_topic(
    *,
    session: Session,
    db_thesis_topic: ThesisTopic,
    thesis_topic_in: ThesisTopicUpdate,
) -> Any:
    thesis_topic_data = thesis_topic_in.model_dump(exclude_unset=True)
    db_thesis_topic.sqlmodel_update(thesis_topic_data)
    session.add(db_thesis_topic)
    session.commit()
    session.refresh(db_thesis_topic)
    return db_thesis_topic


def get_thesis_application_by_topic_and_student(
    *,
    session: Session,
    topic_id: uuid.UUID,
    student_id: uuid.UUID,
) -> ThesisApplication | None:
    existing_application = session.exec(
        select(ThesisApplication).where(
            ThesisApplication.thesis_topic_id == topic_id,
            ThesisApplication.student_id == student_id,
        )
    ).first()
    return existing_application


def create_thesis_application_student(
    *,
    session: Session,
    thesis_application_create: ThesisApplicationCreateStudent,
    user_id: uuid.UUID,
) -> ThesisApplication:
    db_obj = ThesisApplication.model_validate(
        thesis_application_create, update={"student_id": user_id}
    )
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def create_thesis_application(
    *,
    session: Session,
    thesis_application_create: ThesisApplicationCreate,
) -> ThesisApplication:
    db_obj = ThesisApplication.model_validate(thesis_application_create)
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj


def update_thesis_application(
    *,
    session: Session,
    db_thesis_application: ThesisApplication,
    thesis_application_in: ThesisApplicationUpdate,
) -> Any:
    thesis_application_data = thesis_application_in.model_dump(exclude_unset=True)
    db_thesis_application.sqlmodel_update(thesis_application_data)
    session.add(db_thesis_application)
    session.commit()
    session.refresh(db_thesis_application)
    return db_thesis_application


def update_thesis_application_promoter(
    *,
    session: Session,
    db_thesis_application: ThesisApplication,
    thesis_application_in: ThesisApplicationUpdatePromoter,
) -> Any:
    thesis_application_data = thesis_application_in.model_dump(exclude_unset=True)
    db_thesis_application.sqlmodel_update(thesis_application_data)
    session.add(db_thesis_application)
    session.commit()
    session.refresh(db_thesis_application)
    return db_thesis_application
