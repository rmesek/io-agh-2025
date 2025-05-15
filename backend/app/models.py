import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from pydantic import EmailStr
from sqlmodel import Column, Field, Relationship, SQLModel
from sqlmodel import Enum as SQLModelEnum


class UserRoleEnum(str, PyEnum):
    STUDENT = "student"
    PROMOTER = "promoter"
    # ADMIN is represented by is_superuser=True


class StudyStageEnum(str, PyEnum):
    BACHELOR = "bachelor"
    MASTER = "master"
    ANY = "any"


class ApplicationStatusEnum(str, PyEnum):
    PENDING_APPROVAL = "pending_approval"
    APPROVED_BY_PROMOTER = "approved_by_promoter"
    REJECTED_BY_PROMOTER = "rejected_by_promoter"
    CANCELED_BY_STUDENT = "canceled_by_student"


class ThesisTopicStatusEnum(str, PyEnum):
    OPEN = "open"
    CLOSED = "closed"
    FULL = "full"


# --- user ---


# Shared properties
class UserBase(SQLModel):
    email: EmailStr = Field(unique=True, index=True, max_length=255)
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRoleEnum | None = Field(
        default=None, sa_column=Column(SQLModelEnum(UserRoleEnum), nullable=True)
    )


# Database model, database table inferred from class name
class User(UserBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    hashed_password: str = Field(nullable=False)

    # --- relationships ---
    items: list["Item"] = Relationship(back_populates="owner", cascade_delete=True)

    # one-to-one relationship to profile tables
    student_profile: "StudentProfile | None" = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"uselist": False, "cascade_delete": True},
    )
    promoter_profile: "PromoterProfile | None" = Relationship(
        back_populates="user",
        sa_relationship_kwargs={"uselist": False, "cascade_delete": True},
    )

    # if user is a promoter: they can author multiple thesis topics
    thesis_topics_authored: list["ThesisTopic"] = Relationship(
        back_populates="promoter",
        sa_relationship_kwargs={
            "primaryjoin": "User.id==ThesisTopic.promoter_id",
            "cascade_delete": True,
        },
    )

    # if user is a student: they can apply to multiple thesis topics
    thesis_applications_submitted: list["ThesisApplication"] = Relationship(
        back_populates="student",
        sa_relationship_kwargs={
            "primaryjoin": "User.id==ThesisApplication.student_id",
            "cascade_delete": True,
        },
    )


# Properties to receive via API on creation
class UserCreate(UserBase):
    password: str = Field(min_length=8, max_length=40)


class UserRegister(SQLModel):
    email: EmailStr = Field(max_length=255)
    password: str = Field(min_length=8, max_length=40)
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRoleEnum = Field(
        sa_column=Column(SQLModelEnum(UserRoleEnum), nullable=False)
    )


# Properties to receive via API on update, all are optional
class UserUpdate(SQLModel):
    email: EmailStr | None = Field(default=None, max_length=255)
    is_active: bool | None = Field(default=None)
    is_superuser: bool | None = Field(default=None)
    full_name: str | None = Field(default=None, max_length=255)
    role: UserRoleEnum | None = Field(
        default=None, sa_column=Column(SQLModelEnum(UserRoleEnum), nullable=True)
    )
    password: str | None = Field(default=None, min_length=8, max_length=40)


class UserUpdateMe(SQLModel):
    full_name: str | None = Field(default=None, max_length=255)
    email: EmailStr | None = Field(default=None, max_length=255)


class UpdatePassword(SQLModel):
    current_password: str = Field(min_length=8, max_length=40)
    new_password: str = Field(min_length=8, max_length=40)


# Properties to return via API, id is always required
class UserPublic(UserBase):
    id: uuid.UUID


class UsersPublic(SQLModel):
    data: list[UserPublic]
    count: int


# --- end user ---


# --- promoter profile ---


class PromoterProfileBase(SQLModel):
    academic_degree: str | None = Field(default=None, max_length=100)
    can_supervise_bachelor: bool = Field(default=False)
    can_supervise_master: bool = Field(default=False)
    student_limit: int = Field(default=5, ge=0)
    department: str | None = Field(default=None, max_length=255)
    research_interests: list[str] = Field(default_factory=list)


class PromoterProfile(PromoterProfileBase, table=True):
    user_id: uuid.UUID = Field(
        default=None,
        primary_key=True,
        foreign_key="user.id",
        unique=True,
        nullable=False,
    )

    # --- relationships ---
    # one-to-one relationship to user table
    user: "User" = Relationship(back_populates="promoter_profile")


class PromoterProfileCreate(PromoterProfileBase):
    user_id: uuid.UUID


class PromoterProfileUpdate(SQLModel):
    academic_degree: str | None = Field(default=None, max_length=100)
    can_supervise_bachelor: bool | None = Field(default=None)
    can_supervise_master: bool | None = Field(default=None)
    student_limit: int | None = Field(default=None, ge=0)
    department: str | None = Field(default=None, max_length=255)
    research_interests: list[str] | None = Field(default=None)


class PromoterProfilePublic(PromoterProfileBase):
    user_id: uuid.UUID
    user: UserPublic | None = Field(default=None)


class PromoterProfilesPublic(SQLModel):
    data: list[PromoterProfilePublic]
    count: int


# --- end promoter profile ---


# --- student profile ---


class StudentProfileBase(SQLModel):
    study_stage: StudyStageEnum | None = Field(
        default=None, sa_column=Column(SQLModelEnum(StudyStageEnum))
    )
    year_of_study: int | None = Field(default=None, ge=1, le=7)
    department: str | None = Field(default=None, max_length=255)


class StudentProfile(StudentProfileBase, table=True):
    user_id: uuid.UUID = Field(
        default=None,
        primary_key=True,
        foreign_key="user.id",
        unique=True,
        nullable=False,
    )

    # --- relationships ---
    # one-to-one relationship to user table
    user: User = Relationship(back_populates="student_profile")


class StudentProfileCreate(StudentProfileBase):
    user_id: uuid.UUID


class StudentProfileUpdate(SQLModel):
    study_stage: StudyStageEnum | None = Field(default=None)
    year_of_study: int | None = Field(default=None, ge=1, le=7)
    department: str | None = Field(default=None, max_length=255)


class StudentProfilePublic(StudentProfileBase):
    user_id: uuid.UUID
    user: UserPublic | None = Field(default=None)


class StudentProfilesPublic(SQLModel):
    data: list[StudentProfilePublic]
    count: int


# --- end student profile ---


# --- thesis topic ---


class ThesisTopicBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None)
    target_study_stage: StudyStageEnum = Field(
        sa_column=Column(SQLModelEnum(StudyStageEnum)), default=StudyStageEnum.ANY
    )
    slots_total: int = Field(default=1, ge=1)
    slots_available: int = Field(default=1, ge=0)
    status: ThesisTopicStatusEnum = Field(
        sa_column=Column(SQLModelEnum(ThesisTopicStatusEnum)),
        default=ThesisTopicStatusEnum.OPEN,
    )


class ThesisTopic(ThesisTopicBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    promoter_id: uuid.UUID = Field(foreign_key="user.id")

    promoter: User = Relationship(back_populates="thesis_topics_authored")
    applications: list["ThesisApplication"] = Relationship(
        back_populates="thesis_topic", cascade_delete=True
    )

    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        nullable=False,
        sa_column_kwargs={"onupdate": lambda: datetime.now(timezone.utc)},
    )


class ThesisTopicCreate(ThesisTopicBase):
    promoter_id: uuid.UUID | None = Field(default=None)


class ThesisTopicUpdate(SQLModel):  # All fields optional for update
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None)
    target_study_stage: StudyStageEnum | None = None
    slots_total: int | None = Field(default=None, ge=1)
    status: ThesisTopicStatusEnum | None = None


class ThesisTopicPublic(ThesisTopicBase):
    id: uuid.UUID
    promoter_id: uuid.UUID
    promoter: UserPublic | None = None
    created_at: datetime
    updated_at: datetime


class ThesisTopicsPublic(SQLModel):
    data: list[ThesisTopicPublic]
    count: int


# --- end thesis topic ---


# --- thesis application ---


class ThesisApplicationBase(SQLModel):
    application_date: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    status: ApplicationStatusEnum = Field(
        sa_column=Column(SQLModelEnum(ApplicationStatusEnum)),
        default=ApplicationStatusEnum.PENDING_APPROVAL,
    )


class ThesisApplication(ThesisApplicationBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    student_id: uuid.UUID = Field(foreign_key="user.id")
    thesis_topic_id: uuid.UUID = Field(foreign_key="thesistopic.id")

    promoter_id: uuid.UUID = Field(foreign_key="user.id")

    student: User = Relationship(
        back_populates="thesis_applications_submitted",
        sa_relationship_kwargs={"foreign_keys": "[ThesisApplication.student_id]"},
    )
    thesis_topic: ThesisTopic = Relationship(back_populates="applications")

    resolution_date: datetime | None = Field(default=None)


class ThesisApplicationCreate(SQLModel):
    thesis_topic_id: uuid.UUID
    student_id: uuid.UUID | None = Field(default=None)


class ThesisApplicationUpdate(SQLModel):
    status: ApplicationStatusEnum


class ThesisApplicationPublic(ThesisApplicationBase):
    id: uuid.UUID
    student_id: uuid.UUID
    thesis_topic_id: uuid.UUID
    promoter_id: uuid.UUID
    student: UserPublic | None = None
    thesis_topic: ThesisTopicPublic | None = None
    resolution_date: datetime | None


class ThesisApplicationsPublic(SQLModel):
    data: list[ThesisApplicationPublic]
    count: int


# --- end thesis application ---


# --- item ---


# Shared properties
class ItemBase(SQLModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=255)


# Properties to receive on item creation
class ItemCreate(ItemBase):
    pass


# Properties to receive on item update
class ItemUpdate(ItemBase):
    title: str | None = Field(default=None, min_length=1, max_length=255)  # type: ignore


# Database model, database table inferred from class name
class Item(ItemBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    owner_id: uuid.UUID = Field(
        foreign_key="user.id", nullable=False, ondelete="CASCADE"
    )
    owner: User | None = Relationship(back_populates="items")


# Properties to return via API, id is always required
class ItemPublic(ItemBase):
    id: uuid.UUID
    owner_id: uuid.UUID


class ItemsPublic(SQLModel):
    data: list[ItemPublic]
    count: int


# --- end item ---


# Generic message
class Message(SQLModel):
    message: str


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class NewPassword(SQLModel):
    token: str
    new_password: str = Field(min_length=8, max_length=40)
