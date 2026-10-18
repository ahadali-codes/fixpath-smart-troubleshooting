from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import select, func
from app.main import app
from app.db import SessionLocal
from app.models import User, Answer
from app.rules import PROBLEMS, definitions, validate_graph
from conftest import register


def start(client, pid="laptop-charge"):
    r = client.post(
        "/api/sessions", json={"problem_id": pid, "symptoms": "Reported test symptoms."}
    )
    assert r.status_code == 201, r.text
    return r.json()


def answer(client, c, value, node=None):
    return client.post(
        "/api/sessions/" + c["id"] + "/answers",
        json={
            "node_id": node or c["current"]["id"],
            "answer": value,
            "version": c["version"],
        },
    )


def test_migrations_and_catalog(client):
    assert client.get("/api/health").json()["status"] == "ok"
    catalog = client.get("/api/catalog").json()
    assert len(catalog) == 2 and sum(len(x["problems"]) for x in catalog) == 12
    for pid, *_ in PROBLEMS:
        validate_graph(definitions(pid))


def test_auth_and_revocation(client):
    email = register(client)
    assert client.get("/api/auth/me").json()["email"] == email
    token = client.cookies.get("fixpath_session")
    assert client.post("/api/auth/logout").status_code == 204
    assert client.get("/api/auth/me").status_code == 401
    client.cookies.set("fixpath_session", token)
    assert client.get("/api/auth/me").status_code == 401
    client.cookies.clear()
    assert (
        client.post(
            "/api/auth/login", json={"email": email, "password": "bad"}
        ).status_code
        == 401
    )
    assert (
        client.post(
            "/api/auth/login", json={"email": email, "password": "A safe password 123!"}
        ).status_code
        == 200
    )
    assert (
        client.post(
            "/api/auth/password",
            json={
                "current_password": "A safe password 123!",
                "new_password": "My newer password 123!",
            },
        ).status_code
        == 204
    )
    assert (
        client.patch("/api/auth/me", json={"name": "Alice Updated"}).json()["name"]
        == "Alice Updated"
    )


def test_branching_hazard_and_invalid(client):
    register(client)
    case = start(client)
    assert answer(client, case, "invalid").status_code == 422
    normal = answer(client, case, "No").json()
    assert normal["current"]["key"] == "first"
    outlet = answer(client, normal, "No").json()
    assert outlet["current"]["key"] == "outlet" and outlet["current"]["terminal"]
    danger = answer(client, start(client), "Yes").json()
    assert danger["current"]["key"] == "hazard" and danger["status"] == "completed"
    assert "Stop using" in danger["current"]["recommendation"]


def test_persistence_resume_and_correction(client):
    email = register(client)
    case = answer(client, start(client), "No").json()
    case = answer(client, case, "Yes").json()
    assert case["current"]["key"] == "adapter"
    paused = client.patch(
        "/api/sessions/" + case["id"], json={"status": "paused"}
    ).json()
    assert answer(client, paused, "Yes").status_code == 409
    resumed = client.patch(
        "/api/sessions/" + case["id"], json={"status": "active"}
    ).json()
    assert resumed["current"]["key"] == "adapter"
    corrected = answer(client, resumed, "No", case["path"][1]["id"]).json()
    assert corrected["current"]["key"] == "outlet" and len(corrected["path"]) == 2
    assert any(e["kind"] == "answer_corrected" for e in corrected["events"])
    with SessionLocal() as db:
        assert (
            db.scalar(
                select(func.count(Answer.id)).where(
                    Answer.session_id == case["id"], Answer.active.is_(False)
                )
            )
            == 1
        )
    noted = client.post(
        "/api/sessions/" + case["id"] + "/notes",
        json={"text": "Observed charging light."},
    ).json()
    assert len(noted["notes"]) == 1
    client.patch("/api/sessions/" + case["id"], json={"title": "My saved laptop"})
    client.post("/api/auth/logout")
    client.post(
        "/api/auth/login", json={"email": email, "password": "A safe password 123!"}
    )
    saved = client.get("/api/sessions/" + case["id"]).json()
    assert saved["title"] == "My saved laptop" and len(saved["notes"]) == 1
    assert client.get("/api/sessions").json()["total"] == 1
    assert client.delete("/api/sessions/" + case["id"]).status_code == 204
    assert client.get("/api/sessions/" + case["id"]).status_code == 404


def test_ownership(client):
    register(client)
    case = start(client)
    with TestClient(app, headers={"X-FixPath": "1"}) as other:
        register(other, "Bob")
        for method, body in [
            ("get", None),
            ("patch", {"title": "Stolen"}),
            ("delete", None),
        ]:
            r = getattr(other, method)(
                "/api/sessions/" + case["id"], **({"json": body} if body else {})
            )
            assert r.status_code == 404
        assert (
            other.post(
                "/api/sessions/" + case["id"] + "/notes", json={"text": "Cannot access"}
            ).status_code
            == 404
        )
        assert (
            other.post(
                "/api/comparisons",
                json={"repair": "1", "replacement": "2", "session_id": case["id"]},
            ).status_code
            == 404
        )
    assert (
        client.post(
            "/api/sessions", json={"problem_id": "laptop-charge", "user_id": "attacker"}
        ).status_code
        == 422
    )


def test_stale_and_wrong_flow(client):
    register(client)
    case = start(client)
    assert answer(client, case, "No").status_code == 200
    assert answer(client, case, "Yes").status_code == 409
    current = client.get("/api/sessions/" + case["id"]).json()
    assert answer(client, current, "Yes", "router-power:first").status_code == 422


def test_costs(client):
    register(client)
    r = client.post(
        "/api/comparisons",
        json={
            "repair": "100.10",
            "extra": "0.20",
            "replacement": "500.00",
            "age": "2.5",
            "warranty": "No active cover",
        },
    )
    assert r.status_code == 201, r.text
    assert Decimal(r.json()["total_repair"]) == Decimal("100.30")
    assert Decimal(r.json()["difference"]) == Decimal("399.70")
    assert len(client.get("/api/comparisons").json()["items"]) == 1
    for repair, replacement in [
        ("-1", "100"),
        ("1", "0"),
        ("NaN", "100"),
        ("1.001", "100"),
    ]:
        assert (
            client.post(
                "/api/comparisons", json={"repair": repair, "replacement": replacement}
            ).status_code
            == 422
        )


def test_community_and_moderation(client):
    email = register(client)
    assert (
        client.get("/api/community?device=router&status=resolved").json()["total"] >= 1
    )
    body = {
        "title": "My unique testing router experience",
        "device_id": "router",
        "symptoms": "A unique connection symptom for testing.",
        "fixes": "Checked the normal external cable safely.",
        "outcome": "The connection stayed stable afterwards.",
        "resolved": True,
    }
    r = client.post("/api/community", json=body)
    assert r.status_code == 201, r.text
    post = r.json()
    cid = post["id"]
    assert "user_id" not in post and "email" not in post
    assert (
        client.get(
            "/api/community?q=unique%20testing&device=router&status=resolved"
        ).json()["total"]
        == 1
    )
    assert client.get("/api/community?q=%25").json()["total"] == 0
    assert client.post("/api/community/" + cid + "/helpful").json()["helpful"] == 1
    assert client.post("/api/community/" + cid + "/helpful").json()["helpful"] == 0
    assert (
        client.post(
            "/api/community/" + cid + "/report",
            json={"reason": "Please review this example."},
        ).status_code
        == 201
    )
    assert client.get("/api/admin/reports").status_code == 403
    with SessionLocal() as db:
        u = db.scalar(select(User).where(User.email == email))
        u.is_admin = True
        db.commit()
    assert any(
        r["case_id"] == cid for r in client.get("/api/admin/reports").json()["items"]
    )
    assert (
        client.patch("/api/admin/community/" + cid, json={"hidden": True}).status_code
        == 200
    )
    assert client.get("/api/community?q=unique%20testing").json()["total"] == 0
    assert client.get("/api/community/mine").json()["items"][0]["hidden"]
    assert client.delete("/api/community/" + cid).status_code == 204


def test_csrf_and_errors(client):
    assert client.get("/api/sessions").status_code == 401
    assert client.post("/api/community", json={}).status_code == 401
    with TestClient(app) as bare:
        assert bare.post("/api/auth/login", json={}).status_code == 403
        assert (
            bare.post(
                "/api/auth/login",
                headers={"X-FixPath": "1", "Origin": "https://evil.example"},
                json={},
            ).status_code
            == 403
        )
    assert client.get("/api/community?device=invalid").status_code == 422


def test_packaged_frontend_and_unknown_api(client):
    from app.main import DIST

    if DIST.exists():
        assert client.get("/").status_code == 200
        assert client.get("/cases/deep-link").status_code == 200
        assert "FixPath" in client.get("/").text
        assert len(list((DIST / "assets").glob("*.js"))) > 0
    assert client.get("/api/no-such-route").status_code == 404
