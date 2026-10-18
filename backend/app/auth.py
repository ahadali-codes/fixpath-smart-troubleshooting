"""Argon2 passwords, expiring JWT cookies and server-side token revocation."""

from datetime import datetime, timedelta, timezone
import os, secrets, time
from collections import defaultdict, deque
from pathlib import Path
import jwt
from pwdlib import PasswordHash
from fastapi import Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from .db import get_db
from .models import User

passwords = PasswordHash.recommended()
DUMMY_HASH = passwords.hash(secrets.token_urlsafe(32))
# Local development persists a random secret; production must supply JWT_SECRET.
secret = os.getenv("JWT_SECRET")
if not secret:
    if os.getenv("ENVIRONMENT") == "production":
        raise RuntimeError("JWT_SECRET is required in production")
    path = Path(".local_jwt_secret")
    try:
        fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(fd, "w") as f:
            f.write(secrets.token_urlsafe(48))
    except FileExistsError:
        pass
    secret = path.read_text().strip()
if len(secret) < 32:
    raise RuntimeError("JWT_SECRET must contain at least 32 characters")
SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
if os.getenv("ENVIRONMENT") == "production" and not SECURE:
    raise RuntimeError("Set COOKIE_SECURE=true with HTTPS in production")

# Single-process abuse throttle. Production replicas require a shared rate limiter.
attempts = defaultdict(deque)


def throttle(key: str, limit: int = 15):
    now = time.monotonic()
    bucket = attempts[key]
    while bucket and bucket[0] < now - 900:
        bucket.popleft()
    if len(bucket) >= limit:
        raise HTTPException(429, "Too many attempts. Try again in 15 minutes.")
    bucket.append(now)
    if len(attempts) > 10000:
        for old in list(attempts)[:5000]:
            if not attempts[old] or attempts[old][-1] < now - 900:
                attempts.pop(old, None)


def set_cookie(response: Response, user: User):
    token = jwt.encode(
        {
            "sub": user.id,
            "ver": user.token_version,
            "exp": datetime.now(timezone.utc) + timedelta(hours=8),
            "iat": datetime.now(timezone.utc),
            "aud": "fixpath",
        },
        secret,
        algorithm="HS256",
    )
    response.set_cookie(
        "fixpath_session",
        token,
        httponly=True,
        secure=SECURE,
        samesite="strict",
        max_age=28800,
        path="/",
    )


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    try:
        token = request.cookies.get("fixpath_session", "")
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="fixpath",
            options={"require": ["sub", "ver", "exp", "iat"]},
        )
        user = db.get(User, payload["sub"])
        if not user or user.token_version != payload["ver"]:
            raise ValueError()
        return user
    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise HTTPException(401, "Please sign in to continue.")


def admin_user(user: User = Depends(current_user)):
    if not user.is_admin:
        raise HTTPException(403, "Moderator access required.")
    return user


def public_user(user):
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "is_admin": user.is_admin,
    }
