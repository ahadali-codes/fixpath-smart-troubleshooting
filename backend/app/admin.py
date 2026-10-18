"""Promote an existing registered account: python -m app.admin you@example.com"""

import sys
from sqlalchemy import select
from .db import SessionLocal
from .models import User

if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python -m app.admin EMAIL")
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == sys.argv[1].lower()))
        if not user:
            raise SystemExit("Register that account first.")
        user.is_admin = True
        db.commit()
        print("Moderator access enabled.")
