"""API input contracts; user identity and outcomes are always server-derived."""

from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, Field, EmailStr, ConfigDict


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Register(StrictModel):
    name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)


class Login(StrictModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class Profile(StrictModel):
    name: str = Field(min_length=2, max_length=80)


class PasswordChange(StrictModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=10, max_length=128)


class Start(StrictModel):
    problem_id: str = Field(max_length=60)
    symptoms: str = Field(default="", max_length=2000)


class AnswerInput(StrictModel):
    node_id: str = Field(max_length=100)
    answer: str = Field(max_length=40)
    version: int = Field(ge=0)


class SessionPatch(StrictModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    status: Literal["active", "paused", "resolved", "unresolved"] | None = None


class NoteInput(StrictModel):
    text: str = Field(min_length=1, max_length=2000)


class CostInput(StrictModel):
    repair: Decimal = Field(ge=0, le=1000000000, decimal_places=2)
    extra: Decimal = Field(default=Decimal("0"), ge=0, le=1000000000, decimal_places=2)
    replacement: Decimal = Field(gt=0, le=1000000000, decimal_places=2)
    age: Decimal = Field(default=Decimal("0"), ge=0, le=100, decimal_places=1)
    warranty: str = Field(default="", max_length=500)
    session_id: str | None = None


class CommunityInput(StrictModel):
    title: str = Field(min_length=5, max_length=120)
    device_id: Literal["laptop", "router"]
    symptoms: str = Field(min_length=10, max_length=3000)
    fixes: str = Field(min_length=10, max_length=3000)
    outcome: str = Field(min_length=10, max_length=3000)
    resolved: bool = False


class ReportInput(StrictModel):
    reason: str = Field(min_length=5, max_length=500)


class Moderate(StrictModel):
    hidden: bool


# Response models keep the public API explicit in OpenAPI without exposing ORM objects.
class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    is_admin: bool


class NodeOut(BaseModel):
    id: str
    key: str
    question: str
    explanation: str
    safety: str
    component: str
    terminal: bool
    result: str
    recommendation: str
    options: list[str]


class SessionOut(BaseModel):
    id: str
    title: str
    symptoms: str
    status: str
    version: int
    device: str
    problem: str
    problem_id: str
    created_at: str
    updated_at: str
    current: NodeOut
    path: list[dict]
    events: list[dict]
    notes: list[dict]
    graph: dict


class CommunityOut(BaseModel):
    id: str
    title: str
    device: str
    symptoms: str
    fixes: str
    outcome: str
    resolved: bool
    sample: bool
    created_at: str
    helpful: int
    mine: bool


class CostOut(BaseModel):
    id: str
    repair: str
    extra: str
    total_repair: str
    replacement: str
    difference: str
    age: str
    warranty: str
    session_id: str | None
    created_at: str
