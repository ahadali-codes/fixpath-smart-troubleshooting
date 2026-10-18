import os, tempfile, uuid
from pathlib import Path

TMP = tempfile.TemporaryDirectory()
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(TMP.name) / "test.db")
os.environ["JWT_SECRET"] = "test-only-secret-which-is-long-enough-123456"
import pytest
from alembic.config import Config
from alembic import command
from fastapi.testclient import TestClient
from app.main import app
from app.seed import seed


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    command.upgrade(Config("alembic.ini"), "head")
    seed()
    yield
    TMP.cleanup()


@pytest.fixture
def client():
    with TestClient(app, headers={"X-FixPath": "1"}) as client:
        yield client


def register(client, name="Alice"):
    email = uuid.uuid4().hex + "@example.com"
    response = client.post(
        "/api/auth/register",
        json={"name": name, "email": email, "password": "A safe password 123!"},
    )
    assert response.status_code == 201, response.text
    return email
