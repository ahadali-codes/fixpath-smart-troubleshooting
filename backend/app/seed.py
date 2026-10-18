"""Idempotent rules and clearly labeled fictional public examples; no demo login."""

import secrets
from sqlalchemy import select
from .db import SessionLocal
from .models import Device, Problem, Flow, Node, Transition, User, CommunityCase
from .rules import PROBLEMS, definitions, validate_graph
from .auth import passwords


def seed():
    with SessionLocal() as db:
        for key, label in [("laptop", "Laptop"), ("router", "Router")]:
            if not db.get(Device, key):
                db.add(Device(id=key, label=label))
        db.flush()
        for pid, device, title, description in PROBLEMS:
            nodes = definitions(pid)
            validate_graph(nodes)
            if db.get(Flow, pid):
                continue
            db.add(
                Problem(id=pid, device_id=device, title=title, description=description)
            )
            db.flush()
            db.add(Flow(id=pid, problem_id=pid, root_key="safety", version=1))
            db.flush()
            for item in nodes:
                values = {key: value for key, value in item.items() if key != "targets"}
                db.add(Node(id=f'{pid}:{item["key"]}', flow_id=pid, **values))
            db.flush()
            for item in nodes:
                for answer, target in item["targets"].items():
                    db.add(
                        Transition(
                            node_id=f'{pid}:{item["key"]}',
                            answer=answer,
                            next_node_id=f"{pid}:{target}",
                        )
                    )
        db.flush()
        author = db.scalar(select(User).where(User.email == "examples@fixpath.invalid"))
        if not author:
            author = User(
                name="FixPath examples",
                email="examples@fixpath.invalid",
                password_hash=passwords.hash(secrets.token_urlsafe(40)),
            )
            db.add(author)
            db.flush()
            examples = [
                (
                    "Laptop charging again after checking the outlet",
                    "laptop",
                    "The laptop showed no charging light at the desk.",
                    "Checked an undamaged lamp in the outlet, then tried a known-working outlet.",
                    "Charging resumed in the other outlet. An electrician was contacted about the original socket.",
                    True,
                ),
                (
                    "Wi-Fi became stable closer to the router",
                    "router",
                    "Video calls dropped in a distant room but worked nearby.",
                    "Compared two devices near the router, then moved the router to an open shelf following its manual.",
                    "Coverage improved in the room; no security settings were changed.",
                    True,
                ),
                (
                    "Blank screen with normal startup sounds",
                    "laptop",
                    "The laptop made normal startup sounds but the screen stayed blank.",
                    "Checked brightness and tried an already available compatible external monitor.",
                    "External display worked. A qualified technician was asked to inspect the built-in display path.",
                    False,
                ),
            ]
            for title, device, symptoms, fixes, outcome, resolved in examples:
                db.add(
                    CommunityCase(
                        user_id=author.id,
                        title=title,
                        device_id=device,
                        symptoms=symptoms,
                        fixes=fixes,
                        outcome=outcome,
                        resolved=resolved,
                        sample=True,
                    )
                )
        db.commit()


if __name__ == "__main__":
    seed()
    print("Diagnostic rules and fictional examples seeded.")
