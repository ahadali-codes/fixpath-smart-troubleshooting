"""Relational data model. Public community records are explicit copies, never private sessions."""

from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import (
    Column,
    String,
    Integer,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    JSON,
    Numeric,
    CheckConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.orm import declarative_base

Base = declarative_base()


def uid():
    return uuid4().hex


def now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"
    id = Column(String(32), primary_key=True, default=uid)
    email = Column(String(254), unique=True, nullable=False, index=True)
    name = Column(String(80), nullable=False)
    password_hash = Column(Text, nullable=False)
    token_version = Column(Integer, nullable=False, default=0)
    is_admin = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=now, nullable=False)
    sessions = relationship(
        "DiagnosticSession", back_populates="user", passive_deletes=True
    )


class Device(Base):
    __tablename__ = "devices"
    id = Column(String(20), primary_key=True)
    label = Column(String(50), nullable=False)
    problems = relationship("Problem", back_populates="device")


class Problem(Base):
    __tablename__ = "problem_categories"
    id = Column(String(60), primary_key=True)
    device_id = Column(ForeignKey("devices.id"), nullable=False, index=True)
    title = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    device = relationship("Device", back_populates="problems")
    flow = relationship("Flow", uselist=False, back_populates="problem")


class Flow(Base):
    __tablename__ = "diagnostic_flows"
    id = Column(String(60), primary_key=True)
    problem_id = Column(
        ForeignKey("problem_categories.id"), unique=True, nullable=False
    )
    version = Column(Integer, default=1, nullable=False)
    root_key = Column(String(60), nullable=False, default="safety")
    problem = relationship("Problem", back_populates="flow")
    nodes = relationship("Node", back_populates="flow")


class Node(Base):
    __tablename__ = "diagnostic_nodes"
    id = Column(String(100), primary_key=True)
    flow_id = Column(ForeignKey("diagnostic_flows.id"), nullable=False, index=True)
    key = Column(String(60), nullable=False)
    question = Column(Text, nullable=False)
    explanation = Column(Text, nullable=False)
    safety = Column(Text, nullable=False, default="")
    component = Column(String(40), nullable=False, default="")
    terminal = Column(Boolean, nullable=False, default=False)
    result = Column(Text, nullable=False, default="")
    recommendation = Column(Text, nullable=False, default="")
    flow = relationship("Flow", back_populates="nodes")
    __table_args__ = (UniqueConstraint("flow_id", "key"),)


class Transition(Base):
    __tablename__ = "diagnostic_transitions"
    id = Column(Integer, primary_key=True)
    node_id = Column(
        ForeignKey("diagnostic_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    answer = Column(String(40), nullable=False)
    next_node_id = Column(ForeignKey("diagnostic_nodes.id"), nullable=False)
    __table_args__ = (UniqueConstraint("node_id", "answer"),)


class DiagnosticSession(Base):
    __tablename__ = "diagnostic_sessions"
    id = Column(String(32), primary_key=True, default=uid)
    user_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    flow_id = Column(ForeignKey("diagnostic_flows.id"), nullable=False)
    current_node_id = Column(ForeignKey("diagnostic_nodes.id"), nullable=False)
    title = Column(String(120), nullable=False)
    symptoms = Column(Text, nullable=False, default="")
    status = Column(String(20), nullable=False, default="active")
    version = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), default=now, nullable=False)
    updated_at = Column(
        DateTime(timezone=True), default=now, nullable=False, index=True
    )
    user = relationship("User", back_populates="sessions")
    __table_args__ = (
        CheckConstraint(
            "status IN ('active','paused','completed','resolved','unresolved')"
        ),
    )


class Answer(Base):
    __tablename__ = "diagnostic_answers"
    id = Column(Integer, primary_key=True)
    session_id = Column(
        ForeignKey("diagnostic_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    node_id = Column(ForeignKey("diagnostic_nodes.id"), nullable=False)
    answer = Column(String(40), nullable=False)
    position = Column(Integer, nullable=False)
    active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=now, nullable=False)


class Event(Base):
    __tablename__ = "diagnostic_events"
    id = Column(Integer, primary_key=True)
    session_id = Column(
        ForeignKey("diagnostic_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    kind = Column(String(40), nullable=False)
    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=now, nullable=False)


class Note(Base):
    __tablename__ = "repair_notes"
    id = Column(String(32), primary_key=True, default=uid)
    session_id = Column(
        ForeignKey("diagnostic_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    text = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=now, nullable=False)


class Comparison(Base):
    __tablename__ = "repair_cost_comparisons"
    id = Column(String(32), primary_key=True, default=uid)
    user_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    session_id = Column(ForeignKey("diagnostic_sessions.id", ondelete="SET NULL"))
    repair = Column(Numeric(14, 2), nullable=False)
    extra = Column(Numeric(14, 2), nullable=False)
    replacement = Column(Numeric(14, 2), nullable=False)
    age = Column(Numeric(5, 1), nullable=False)
    warranty = Column(String(500), nullable=False, default="")
    created_at = Column(DateTime(timezone=True), default=now, nullable=False)
    __table_args__ = (
        CheckConstraint("repair >= 0 AND extra >= 0 AND replacement > 0 AND age >= 0"),
    )


class CommunityCase(Base):
    __tablename__ = "community_cases"
    id = Column(String(32), primary_key=True, default=uid)
    user_id = Column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(String(120), nullable=False)
    device_id = Column(ForeignKey("devices.id"), nullable=False, index=True)
    symptoms = Column(Text, nullable=False)
    fixes = Column(Text, nullable=False)
    outcome = Column(Text, nullable=False)
    resolved = Column(Boolean, nullable=False, default=False, index=True)
    hidden = Column(Boolean, nullable=False, default=False)
    sample = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=now, nullable=False)


class Vote(Base):
    __tablename__ = "community_votes"
    id = Column(Integer, primary_key=True)
    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    case_id = Column(
        ForeignKey("community_cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    __table_args__ = (UniqueConstraint("user_id", "case_id"),)


class Report(Base):
    __tablename__ = "community_reports"
    id = Column(Integer, primary_key=True)
    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    case_id = Column(
        ForeignKey("community_cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    reason = Column(String(500), nullable=False)
    reviewed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), default=now, nullable=False)
    __table_args__ = (UniqueConstraint("user_id", "case_id"),)


metadata = Base.metadata
