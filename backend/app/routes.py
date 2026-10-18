"""Authenticated REST API with explicit private/public boundaries."""

from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Response, Request, Query, Header
from sqlalchemy import select, func, or_
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .db import get_db
from .models import (
    User,
    Device,
    Problem,
    Flow,
    Node,
    DiagnosticSession,
    Event,
    Note,
    Comparison,
    CommunityCase,
    Vote,
    Report,
    now,
)
from .schemas import (
    Register,
    Login,
    Profile,
    PasswordChange,
    Start,
    AnswerInput,
    SessionPatch,
    NoteInput,
    CostInput,
    CommunityInput,
    ReportInput,
    Moderate,
    UserOut,
    SessionOut,
    CommunityOut,
    CostOut,
)
from .auth import (
    passwords,
    current_user,
    admin_user,
    set_cookie,
    public_user,
    throttle,
    DUMMY_HASH,
)
from .engine import owned, serialize, answer_question


def documented_csrf(x_fixpath: str = Header("1", alias="X-FixPath")):
    """Mutating browser requests must send X-FixPath: 1."""
    pass


router = APIRouter(prefix="/api", dependencies=[Depends(documented_csrf)])


@router.get("/health")
def health(db: Session = Depends(get_db)):
    db.execute(select(1))
    return {"status": "ok"}


@router.post("/auth/register", response_model=UserOut, status_code=201)
def register(
    body: Register, response: Response, request: Request, db: Session = Depends(get_db)
):
    throttle("register:" + request.client.host, 20)
    user = User(
        name=body.name,
        email=str(body.email).lower(),
        password_hash=passwords.hash(body.password),
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "An account with that email already exists.")
    set_cookie(response, user)
    return public_user(user)


@router.post("/auth/login", response_model=UserOut)
def login(
    body: Login, response: Response, request: Request, db: Session = Depends(get_db)
):
    throttle("login:" + request.client.host + ":" + str(body.email).lower())
    user = db.scalar(select(User).where(User.email == str(body.email).lower()))
    valid = passwords.verify(body.password, user.password_hash if user else DUMMY_HASH)
    if not user or not valid:
        raise HTTPException(401, "Email or password is incorrect.")
    set_cookie(response, user)
    return public_user(user)


@router.get("/auth/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return public_user(user)


@router.post("/auth/logout", status_code=204)
def logout(
    response: Response,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    user.token_version += 1
    db.commit()
    response.delete_cookie("fixpath_session", path="/")


@router.patch("/auth/me")
def profile(
    body: Profile, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    user.name = body.name
    db.commit()
    return public_user(user)


@router.post("/auth/password", status_code=204)
def change_password(
    body: PasswordChange,
    response: Response,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    if not passwords.verify(body.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect.")
    user.password_hash = passwords.hash(body.new_password)
    user.token_version += 1
    db.commit()
    set_cookie(response, user)


@router.get("/catalog")
def catalog(db: Session = Depends(get_db)):
    return [
        {
            "id": device.id,
            "label": device.label,
            "problems": [
                {"id": p.id, "title": p.title, "description": p.description}
                for p in db.scalars(
                    select(Problem).where(Problem.device_id == device.id)
                )
            ],
        }
        for device in db.scalars(select(Device))
    ]


@router.post("/sessions", response_model=SessionOut, status_code=201)
def start(
    body: Start, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    flow = db.get(Flow, body.problem_id)
    if not flow:
        raise HTTPException(404, "Problem category not found.")
    problem = db.get(Problem, flow.problem_id)
    case = DiagnosticSession(
        user_id=user.id,
        flow_id=flow.id,
        current_node_id=f"{flow.id}:{flow.root_key}",
        title=problem.title,
        symptoms=body.symptoms,
    )
    db.add(case)
    db.flush()
    db.add(
        Event(
            session_id=case.id,
            kind="started",
            text="Reported symptoms: " + (body.symptoms or problem.title),
        )
    )
    db.commit()
    return serialize(db, case)


@router.get("/sessions")
def cases(
    page: int = Query(1, ge=1),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    query = select(DiagnosticSession).where(DiagnosticSession.user_id == user.id)
    count = db.scalar(select(func.count()).select_from(query.subquery()))
    return {
        "items": [
            serialize(db, c, False)
            for c in db.scalars(
                query.order_by(DiagnosticSession.updated_at.desc())
                .offset((page - 1) * 20)
                .limit(20)
            )
        ],
        "total": count,
        "page": page,
    }


@router.get("/sessions/{sid}", response_model=SessionOut)
def get_case(
    sid: str, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    return serialize(db, owned(db, sid, user.id))


@router.post("/sessions/{sid}/answers", response_model=SessionOut)
def answer(
    sid: str,
    body: AnswerInput,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    return answer_question(
        db, owned(db, sid, user.id), body.node_id, body.answer, body.version
    )


@router.patch("/sessions/{sid}", response_model=SessionOut)
def update_case(
    sid: str,
    body: SessionPatch,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    case = owned(db, sid, user.id)
    if body.title is not None:
        case.title = body.title
    if body.status is not None:
        if body.status == "active" and db.get(Node, case.current_node_id).terminal:
            case.status = "completed"
        else:
            case.status = body.status
        db.add(
            Event(
                session_id=sid,
                kind="status",
                text="User-reported status: " + case.status,
            )
        )
    case.version += 1
    case.updated_at = now()
    db.commit()
    return serialize(db, case)


@router.delete("/sessions/{sid}", status_code=204)
def delete_case(
    sid: str, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    db.delete(owned(db, sid, user.id))
    db.commit()


@router.post("/sessions/{sid}/notes", response_model=SessionOut, status_code=201)
def add_note(
    sid: str,
    body: NoteInput,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    case = owned(db, sid, user.id)
    db.add(Note(session_id=sid, text=body.text))
    db.add(Event(session_id=sid, kind="note", text=body.text))
    case.updated_at = now()
    db.commit()
    return serialize(db, case)


def comparison_dict(c):
    total = c.repair + c.extra
    difference = c.replacement - total
    return {
        "id": c.id,
        "repair": str(c.repair),
        "extra": str(c.extra),
        "total_repair": str(total),
        "replacement": str(c.replacement),
        "difference": str(difference),
        "age": str(c.age),
        "warranty": c.warranty,
        "session_id": c.session_id,
        "created_at": c.created_at.isoformat(),
    }


@router.post("/comparisons", response_model=CostOut, status_code=201)
def comparison(
    body: CostInput, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    if body.session_id:
        owned(db, body.session_id, user.id)
    item = Comparison(user_id=user.id, **body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return comparison_dict(item)


@router.get("/comparisons")
def comparisons(
    page: int = Query(1, ge=1),
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    return {
        "items": [
            comparison_dict(c)
            for c in db.scalars(
                select(Comparison)
                .where(Comparison.user_id == user.id)
                .order_by(Comparison.created_at.desc())
                .offset((page - 1) * 20)
                .limit(20)
            )
        ]
    }


def community_dict(db, c, viewer=None):
    return {
        "id": c.id,
        "title": c.title,
        "device": c.device_id,
        "symptoms": c.symptoms,
        "fixes": c.fixes,
        "outcome": c.outcome,
        "resolved": c.resolved,
        "sample": c.sample,
        "created_at": c.created_at.isoformat(),
        "helpful": db.scalar(select(func.count(Vote.id)).where(Vote.case_id == c.id)),
        "mine": bool(viewer and c.user_id == viewer.id),
    }


@router.get("/community")
def community(
    q: str = Query("", max_length=100),
    device: str = Query("", pattern="^(laptop|router)?$"),
    status: str = Query("", pattern="^(resolved|unresolved)?$"),
    page: int = Query(1, ge=1),
    db: Session = Depends(get_db),
):
    query = select(CommunityCase).where(CommunityCase.hidden.is_(False))
    if q:
        pattern = (
            "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"
        )
        query = query.where(
            or_(
                CommunityCase.title.ilike(pattern, escape="\\"),
                CommunityCase.symptoms.ilike(pattern, escape="\\"),
                CommunityCase.fixes.ilike(pattern, escape="\\"),
                CommunityCase.outcome.ilike(pattern, escape="\\"),
            )
        )
    if device:
        query = query.where(CommunityCase.device_id == device)
    if status:
        query = query.where(CommunityCase.resolved == (status == "resolved"))
    count = db.scalar(select(func.count()).select_from(query.subquery()))
    return {
        "items": [
            community_dict(db, c)
            for c in db.scalars(
                query.order_by(CommunityCase.created_at.desc())
                .offset((page - 1) * 12)
                .limit(12)
            )
        ],
        "total": count,
        "page": page,
    }


@router.get("/community/mine")
def mine(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return {
        "items": [
            {**community_dict(db, c, user), "hidden": c.hidden}
            for c in db.scalars(
                select(CommunityCase)
                .where(CommunityCase.user_id == user.id)
                .order_by(CommunityCase.created_at.desc())
                .limit(100)
            )
        ]
    }


@router.post("/community", response_model=CommunityOut, status_code=201)
def publish(
    body: CommunityInput,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    throttle("publish:" + user.id, 20)
    c = CommunityCase(user_id=user.id, **body.model_dump())
    db.add(c)
    db.commit()
    return community_dict(db, c, user)


@router.delete("/community/{cid}", status_code=204)
def delete_community(
    cid: str, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    c = db.get(CommunityCase, cid)
    if not c or c.user_id != user.id:
        raise HTTPException(404, "Contribution not found.")
    db.delete(c)
    db.commit()


@router.post("/community/{cid}/helpful")
def helpful(
    cid: str, user: User = Depends(current_user), db: Session = Depends(get_db)
):
    c = db.get(CommunityCase, cid)
    if not c or c.hidden:
        raise HTTPException(404, "Community case not found.")
    old = db.scalar(select(Vote).where(Vote.user_id == user.id, Vote.case_id == cid))
    if old:
        db.delete(old)
    else:
        db.add(Vote(user_id=user.id, case_id=cid))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Vote changed in another tab. Reload.")
    return {
        "helpful": db.scalar(select(func.count(Vote.id)).where(Vote.case_id == cid)),
        "voted": not bool(old),
    }


@router.post("/community/{cid}/report", status_code=201)
def report(
    cid: str,
    body: ReportInput,
    user: User = Depends(current_user),
    db: Session = Depends(get_db),
):
    c = db.get(CommunityCase, cid)
    if not c or c.hidden:
        raise HTTPException(404, "Community case not found.")
    db.add(Report(user_id=user.id, case_id=cid, reason=body.reason))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "You already reported this case.")
    return {"message": "Report saved for moderator review."}


@router.get("/admin/reports")
def reports(admin: User = Depends(admin_user), db: Session = Depends(get_db)):
    return {
        "items": [
            {
                "id": r.id,
                "case_id": r.case_id,
                "reason": r.reason,
                "reviewed": r.reviewed,
                "case_title": db.get(CommunityCase, r.case_id).title,
                "hidden": db.get(CommunityCase, r.case_id).hidden,
            }
            for r in db.scalars(
                select(Report).order_by(Report.created_at.desc()).limit(100)
            )
        ]
    }


@router.patch("/admin/community/{cid}")
def moderate(
    cid: str,
    body: Moderate,
    admin: User = Depends(admin_user),
    db: Session = Depends(get_db),
):
    c = db.get(CommunityCase, cid)
    if not c:
        raise HTTPException(404, "Community case not found.")
    c.hidden = body.hidden
    for r in db.scalars(select(Report).where(Report.case_id == cid)):
        r.reviewed = True
    db.commit()
    return {"message": "Moderation decision saved."}
