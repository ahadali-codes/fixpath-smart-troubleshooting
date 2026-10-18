# Verification report

## Passed
- Alembic migration on SQLite: fourteen application tables plus migration history.
- Argon2 password hashing and verification.
- Structural validation of all twelve branching diagnostic graphs.
- Ten pytest integration tests passed on a fresh temporary SQLite database.
- Authentication, token revocation, profile/password updates, invalid-answer handling, hazard branching, persistence, pause/resume, answer correction and archived history, private notes, rename and deletion.
- Cross-user access attempts returned 404; client-supplied ownership fields were rejected.
- Stale answer versions returned 409; nodes from another flow were rejected.
- Decimal repair costs, community CRUD/search/filter/vote/report and moderator visibility checks.
- CSRF-header and hostile-Origin rejection.
- Packaged frontend HTML and browser deep links returned successfully through FastAPI TestClient; unknown API path returned 404.
- TypeScript compilation and Vite production bundle completed successfully.
- Playwright discovered the two supplied journey tests. Discovery does not execute them.

## Not verified
- Browser journey execution and desktop/mobile visual inspection: blocked because the required browser-control skill is unavailable in this environment. No preview server or improvised browser route was used.
- PostgreSQL and Docker: configuration supplied, but no live connection/container run was performed.
- Public deployment, load testing, security audit and accessibility audit: not performed.

## Runtime used
Python 3.12.14, FastAPI 0.143.5, SQLAlchemy 2.1.5, Pydantic 2.14.0, PyJWT 2.15.1. Frontend dependency versions are captured in package-lock.json.

Tests emitted one upstream FastAPI/Starlette TestClient deprecation warning; all ten passed. Commands and instructions are in README.md.
