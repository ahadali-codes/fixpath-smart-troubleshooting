"""FastAPI server and same-origin production frontend."""

import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from .routes import router

app = FastAPI(
    title="FixPath API",
    version="1.0.0",
    description="Rule-based laptop/router troubleshooting. Private sessions require an authenticated owner.",
)
allowed_origins = set(
    os.getenv(
        "ALLOWED_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:8000,http://localhost:8000",
    ).split(",")
)


@app.middleware("http")
async def protection(request: Request, call_next):
    if request.url.path.startswith("/api") and request.method in [
        "POST",
        "PATCH",
        "DELETE",
        "PUT",
    ]:
        # Custom header forces cross-site fetches to preflight; no cross-origin CORS
        # is enabled. Origin allowlist also rejects untrusted browser origins.
        if request.headers.get("X-FixPath") != "1" or (
            request.headers.get("origin")
            and request.headers["origin"] not in allowed_origins
        ):
            return JSONResponse(
                {"detail": "Request origin or CSRF header is invalid."}, status_code=403
            )
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["X-Frame-Options"] = "DENY"
    if request.url.path.startswith("/api"):
        response.headers["Cache-Control"] = "no-store"
    return response


app.include_router(router)
DIST = Path(__file__).resolve().parents[2] / "frontend/dist"
if DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        if path.startswith("api/"):
            return JSONResponse({"detail": "Endpoint not found."}, status_code=404)
        return FileResponse(DIST / "index.html")
