# FixPath — Smart Device Troubleshooting Assistant

**Find the Problem. Follow the Fix.**

A connected full-stack application for guided, non-invasive laptop and router checks. React renders an animated interface; FastAPI evaluates branching rules and stores private repair cases in a relational database. There is no AI model, external API key or remote hardware detection.

## What is implemented

- Landing page, laptop/router selection and twelve problem categories.
- Conditional diagnostic flows stored as database nodes and transitions.
- Safety screening before normal troubleshooting, including a stop path for reported hazard signs.
- Current question, explanations, answer options, progress, back/review controls and pause/resume.
- A diagnostic map showing the completed path, current node and actual immediate successor branches; compact mobile view.
- Custom SVG device illustrations with the relevant component highlighted and a location label. Mouse hover explores additional drawn components.
- Automatic private session persistence, rename, notes, timestamps, outcome status and delete.
- Corrections archive downstream answers and recalculate the current branch while preserving event history.
- Repair/replacement comparison using user-entered PKR estimates and exact decimal arithmetic, with saved comparison history.
- Public community search, device/outcome filters, pagination, explicit submission, helpful votes, reports and moderator hide/restore controls.
- Registration, login, profile updates, password changes and server-revoked logout. Private endpoints check ownership on the server.
- Local SQLite, PostgreSQL-compatible SQLAlchemy models, an Alembic migration, idempotent rule/example seed, API tests and browser-test source.

## Visual system

Dark navy surfaces, electric cyan actions, warm orange attention states, fine borders and restrained gradients. Manrope and DM Sans have system-font fallbacks. The landing page includes floating SVGs and a workflow preview; questions transition with Motion. The UI supports smaller screens and honors reduced-motion preferences. There are no stock photos or generated product screenshots.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, Vite, React Router |
| Styling and interaction | Tailwind CSS, custom CSS tokens, Motion for React, Lucide React, SVG |
| Backend | Python, FastAPI, Pydantic |
| Database | SQLAlchemy ORM, Alembic; SQLite locally, PostgreSQL driver included |
| Authentication | Argon2 password hashing; expiring JWT in HttpOnly, SameSite=Strict cookie; token-version revocation |
| Tests | pytest + FastAPI TestClient, Playwright journey source |

## Quick start: downloaded ZIP (Windows)

The ZIP includes a built frontend, so Node is not required merely to run the packaged app. Install Python **3.11 or 3.12** and open `fixpath` in VS Code. From its terminal:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt --timeout 300 --retries 10
.venv\Scripts\python.exe -m alembic upgrade head
.venv\Scripts\python.exe -m app.seed
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open **http://127.0.0.1:8000**. Create your own account; there is no shared demo password. Laptop/router rules and three clearly labeled fictional community examples are seeded. Your private cases start empty.

Always run backend commands from `backend/` so the default database and signing-key paths stay consistent. Stop with Ctrl+C. Restart with the last command; your SQLite records remain.

### macOS/Linux

```bash
cd backend
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt --timeout 300 --retries 10
.venv/bin/python -m alembic upgrade head
.venv/bin/python -m app.seed
.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## Developing the frontend

Install Node.js **22 or newer**. From `frontend/`:

```bash
npm ci
npm run dev
```

Keep the backend running in a second terminal on port 8000. Open the Vite URL at http://127.0.0.1:5173. Its development proxy forwards `/api` to FastAPI. Use the same hostname consistently; cookies are host-specific.

To rebuild the production frontend:

```bash
npm run build
```

Restart FastAPI after the build. It serves `frontend/dist` and handles browser-router deep links. Git ignores built output; anyone cloning from GitHub must build the frontend before expecting FastAPI to serve the interface. The downloaded ZIP includes that output for convenience.

## Project structure

```text
fixpath/
├── backend/
│   ├── app/
│   │   ├── main.py                 # HTTP safeguards and static frontend
│   │   ├── routes.py               # REST endpoints and ownership checks
│   │   ├── schemas.py              # Pydantic input/output contracts
│   │   ├── models.py               # Live ORM models
│   │   ├── db.py                   # Engine and request-scoped connections
│   │   ├── auth.py                 # Passwords, JWT cookies and revocation
│   │   ├── engine.py               # Branching and correction history
│   │   ├── rules.py                # Validated, low-risk flow definitions
│   │   ├── seed.py                 # Idempotent rules and fictional examples
│   │   ├── admin.py                # Promote an existing moderator account
│   │   └── migration_schema_v1.py  # Frozen initial schema
│   ├── alembic/versions/0001_initial.py
│   ├── tests/
│   ├── .env.example
│   ├── alembic.ini
│   └── requirements.txt
├── frontend/
│   ├── src/components/            # DeviceArt, DiagnosticMap and shared UI
│   ├── src/main.tsx               # App shell, navigation and route guards
│   ├── src/pages/                  # Individual route screens
│   ├── src/shared.tsx              # Auth context, catalog hook and helpers
│   ├── src/api.ts                 # Real backend requests
│   ├── src/types.ts
│   ├── src/styles.css
│   ├── e2e/journeys.spec.ts
│   ├── dist/                      # Included in ZIP, ignored by Git
│   └── package.json + package-lock.json
├── docs/ARCHITECTURE.md
├── docs/PHASES.md
├── docs/VERIFICATION.md
├── RUN_AND_GITHUB_GUIDE.md
├── Dockerfile
└── compose.yaml
```

## Environment variables

Defaults are for loopback-only local development. Environment variables can be set in your terminal. If using a `.env` file, launch with `uvicorn app.main:app --env-file .env`; Alembic and seed commands read real environment variables and do not automatically load `.env`.

| Variable | Default / use |
| --- | --- |
| DATABASE_URL | `sqlite:///./fixpath.db` from the backend working directory |
| JWT_SECRET | Local mode creates a random ignored `.local_jwt_secret`; production requires an environment secret of at least 32 characters |
| ENVIRONMENT | Set `production` on a real HTTPS deployment |
| COOKIE_SECURE | `false` locally; must be `true` in production |
| ALLOWED_ORIGINS | Local 8000/5173 origins by default; set your exact HTTPS origin in production |

No real credentials or personal databases are shipped. Changing JWT_SECRET signs out everyone. Logout/password change increments the user's token version and invalidates existing tokens; logout therefore signs out all browser sessions for that user.

### PostgreSQL

Create a database and set a URL such as:

```text
postgresql+psycopg://fixpath:YOUR_URL_ENCODED_PASSWORD@localhost:5432/fixpath
```

Then run the same `alembic upgrade head` and `python -m app.seed` commands against that environment. PostgreSQL execution has **not** been verified here; the SQLite migration and API paths have been verified. The frozen initial migration is intentionally separate from live models. Future model changes require a new Alembic revision, rather than modifying the initial revision on an existing database.

## API documentation

Open http://127.0.0.1:8000/docs for Swagger or `/redoc` for reference documentation. Mutations must send `X-FixPath: 1`; the header is documented in Swagger. Sign in through the browser or API first for private endpoints. Cookies are HttpOnly and not returned to JavaScript.

| Resource | Main operations |
| --- | --- |
| `/api/catalog` | Devices and problem categories |
| `/api/auth/*` | Register, login, logout, profile and password |
| `/api/sessions` | Start and list owned cases (20 per page) |
| `/api/sessions/{id}` | Read, rename, pause/resume, report resolution or delete |
| `/api/sessions/{id}/answers` | Submit or correct an answer using the current version |
| `/api/sessions/{id}/notes` | Add a private note |
| `/api/comparisons` | Save/list private cost comparisons (20 per page) |
| `/api/community` | Search/list and explicitly publish public experiences (12 per page) |
| `/api/community/mine` | Own contributions (latest 100) |
| `/api/community/{id}/helpful` | Toggle one helpful vote per user |
| `/api/community/{id}/report` | Save one report per user/case |
| `/api/admin/reports` | Moderator queue (latest 100) |
| `/api/admin/community/{id}` | Moderator hide/restore |

The server derives the authenticated owner and diagnostic outcome; frontend-supplied user IDs are rejected. Unknown private cases and another user's case both return 404. Invalid inputs return 422, stale answers 409 and unauthenticated requests 401. Public records never include user email, private notes or diagnostic-session content.

## Moderator setup

Register a normal account, then from the backend terminal:

```bash
python -m app.admin your-email@example.com
```

Refresh Account settings to see reports and hide/restore controls. Reports do not automatically remove content; a moderator must review them. Community posts are explicitly labeled unverified experiences. Moderation controls do not guarantee that all harmful material is detected.

## Automated tests

From `backend/`, with its environment active:

```bash
python -m pytest -q
```

The tests create a temporary database using Alembic and do not touch your personal database. They exercise authentication, authorization, real branching, persistence, corrections, pause/resume, calculation precision, community CRUD/search/filter/votes/reports, moderation and API errors.

### Browser test suite (not executed here)

Run the app against a disposable migrated and seeded database. From `frontend/`:

```bash
npm ci
npx playwright install chromium
npm run test:e2e
```

The suite covers registration, guided checks, refresh persistence, pause/resume, logout/login, calculation, community submission, mobile navigation and reduced motion. It creates accounts/cases, so use a disposable database. `FIXPATH_TEST_URL` optionally changes the target URL.

Browser execution was blocked by the unavailable browser-control capability in this environment. Test discovery passed; that is not a claim that browser tests passed. See `docs/VERIFICATION.md`.

## Docker / deployment preparation

A multi-stage Dockerfile builds React and runs FastAPI. `compose.yaml` provides a local PostgreSQL development setup; Docker/PostgreSQL have **not** been executed here. Set `POSTGRES_PASSWORD` and a long random `JWT_SECRET` before `docker compose up --build`.

For a real deployment:
1. Provision PostgreSQL with backups and encrypted connections as appropriate to your host.
2. Build the frontend and package it with the Python service, or use the supplied Dockerfile.
3. Set production JWT_SECRET, DATABASE_URL, COOKIE_SECURE=true, ENVIRONMENT=production and your exact ALLOWED_ORIGINS.
4. Run migrations and seed once as a release job before starting workers. Avoid concurrent migrations/seeding across replicas.
5. Run behind HTTPS with a reverse proxy that forwards to FastAPI. Serve frontend and API under the same origin.
6. Add shared rate limiting, monitoring, recovery/email verification and your required operational controls before public production use.

This is a portfolio implementation with production-minded boundaries, **not** a claim of a hardened audited production service. In-memory rate limiting is process-local, email verification/password recovery are absent, and there is no automatic technical moderation. No hosting deployment has been performed. Sites hosting cannot execute this Python server; deploy it to a Python/container host.

## Safety and scope

Only generic external checks are provided. Manufacturer-specific instructions take precedence. No power-supply opening, battery replacement instructions, factory reset or protection bypass is recommended. Normal router restarts explicitly warn about service interruption. Possible outcomes are based on user reports, never confirmed hardware diagnoses. Free-text symptoms are stored as context and not analyzed by AI. A suspicious symptom requires an honest answer to the explicit safety question; the software does not monitor the physical device.

The map shows completed steps and immediate possible next branches, not an infinite expanded canvas. Notes are append-only; existing answers can be corrected. Costs are PKR only and are user-provided. Latest comparison/contribution/report lists are intentionally capped as documented. Rules are versioned structurally, but the seed does not overwrite existing flows; add a new migration/flow version to evolve live rules safely.

## GitHub and portfolio

See `RUN_AND_GITHUB_GUIDE.md`. Suggested repository name: **fixpath-smart-troubleshooting**.

Suggested description: “A full-stack laptop and router troubleshooting platform with React, TypeScript, FastAPI, branching diagnostics, private repair histories and community solutions.”

Run the app and add genuine screenshots of the landing page and wizard to your README. No screenshots are included or represented as verified browser renders. No GitHub repository has been created or pushed on your behalf.
