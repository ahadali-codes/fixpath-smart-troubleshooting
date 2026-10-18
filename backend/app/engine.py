"""Reusable graph evaluation. Answer corrections preserve history and invalidate descendants."""

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.orm import Session
from .models import (
    DiagnosticSession,
    Node,
    Transition,
    Answer,
    Event,
    Note,
    Problem,
    Flow,
    now,
)


def owned(db: Session, session_id: str, user_id: str):
    case = db.get(DiagnosticSession, session_id)
    if not case or case.user_id != user_id:
        raise HTTPException(404, "Repair case not found.")
    return case


def node_dict(db, node):
    return {
        "id": node.id,
        "key": node.key,
        "question": node.question,
        "explanation": node.explanation,
        "safety": node.safety,
        "component": node.component,
        "terminal": node.terminal,
        "result": node.result,
        "recommendation": node.recommendation,
        "options": [
            t.answer
            for t in db.scalars(
                select(Transition)
                .where(Transition.node_id == node.id)
                .order_by(Transition.id)
            )
        ],
    }


def serialize(db, case, detail=True):
    flow = db.get(Flow, case.flow_id)
    problem = db.get(Problem, flow.problem_id)
    data = {
        "id": case.id,
        "title": case.title,
        "symptoms": case.symptoms,
        "status": case.status,
        "version": case.version,
        "device": problem.device_id,
        "problem": problem.title,
        "problem_id": problem.id,
        "created_at": case.created_at.isoformat(),
        "updated_at": case.updated_at.isoformat(),
        "current": node_dict(db, db.get(Node, case.current_node_id)),
    }
    if detail:
        active = list(
            db.scalars(
                select(Answer)
                .where(Answer.session_id == case.id, Answer.active.is_(True))
                .order_by(Answer.position)
            )
        )
        data["path"] = [
            {
                **node_dict(db, db.get(Node, a.node_id)),
                "answer": a.answer,
                "answered_at": a.created_at.isoformat(),
            }
            for a in active
        ]
        data["events"] = [
            {
                "id": e.id,
                "kind": e.kind,
                "text": e.text,
                "created_at": e.created_at.isoformat(),
            }
            for e in db.scalars(
                select(Event).where(Event.session_id == case.id).order_by(Event.id)
            )
        ]
        data["notes"] = [
            {"id": n.id, "text": n.text, "created_at": n.created_at.isoformat()}
            for n in db.scalars(
                select(Note).where(Note.session_id == case.id).order_by(Note.created_at)
            )
        ]
        data["graph"] = {
            "nodes": [
                node_dict(db, n)
                for n in db.scalars(select(Node).where(Node.flow_id == flow.id))
            ],
            "edges": [
                {"from": t.node_id, "to": t.next_node_id, "answer": t.answer}
                for t in db.scalars(
                    select(Transition)
                    .join(Node, Transition.node_id == Node.id)
                    .where(Node.flow_id == flow.id)
                )
            ],
        }
    return data


def answer_question(db, case, node_id, answer, version):
    active = list(
        db.scalars(
            select(Answer)
            .where(Answer.session_id == case.id, Answer.active.is_(True))
            .order_by(Answer.position)
        )
    )
    previous = next((a for a in active if a.node_id == node_id), None)
    if not previous and node_id != case.current_node_id:
        raise HTTPException(422, "This question is not on the current path.")
    if case.status == "paused":
        raise HTTPException(409, "Resume the case before answering.")
    transition = db.scalar(
        select(Transition).where(
            Transition.node_id == node_id, Transition.answer == answer
        )
    )
    if not transition:
        raise HTTPException(422, "Choose one of this question’s available answers.")
    changed = db.execute(
        update(DiagnosticSession)
        .where(DiagnosticSession.id == case.id, DiagnosticSession.version == version)
        .values(version=version + 1, updated_at=now())
    )
    if changed.rowcount != 1:
        raise HTTPException(
            409, "This case changed in another tab. Reload and try again."
        )
    position = previous.position if previous else len(active)
    for item in active:
        if item.position >= position:
            item.active = False
    db.add(
        Answer(session_id=case.id, node_id=node_id, answer=answer, position=position)
    )
    question = db.get(Node, node_id)
    db.add(
        Event(
            session_id=case.id,
            kind="answer_corrected" if previous else "check",
            text=f"{question.question} → {answer}"
            + (" (previous downstream answers archived)" if previous else ""),
        )
    )
    case.current_node_id = transition.next_node_id
    target = db.get(Node, case.current_node_id)
    case.status = "completed" if target.terminal else "active"
    if target.terminal:
        db.add(
            Event(
                session_id=case.id,
                kind="recommendation",
                text=f"Possible explanation: {target.result} Next step: {target.recommendation}",
            )
        )
    db.commit()
    db.refresh(case)
    return serialize(db, case)
