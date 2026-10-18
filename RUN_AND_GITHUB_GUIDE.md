# Run FixPath and push it using VS Code

## Open the correct folder
Extract the ZIP. In VS Code select File → Open Folder → `fixpath`. You should see `backend`, `frontend` and `README.md`. Open Terminal → New Terminal.

## Run the ZIP on Windows
The frontend is already built in the ZIP. Install Python 3.11/3.12, then run one line at a time:

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt --timeout 300 --retries 10
.venv\Scripts\python.exe -m alembic upgrade head
.venv\Scripts\python.exe -m app.seed
.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. Register an account. Choose Laptop → Won’t charge, answer the safety screening honestly, and follow the checks. Saved cases survive refresh and restarting the server. Use Community to see labeled fictional examples.

The terminal must stay open. Stop with Ctrl+C. To restart, run the last command from the `backend` directory. If port 8000 is occupied, use 8001 and set `ALLOWED_ORIGINS` to include `http://127.0.0.1:8001` before starting. If `python` is missing, try `py -3.12` for the environment-creation command or install Python and restart VS Code.

For macOS/Linux replace `.venv\Scripts\python.exe` with `.venv/bin/python`; use `python3 -m venv .venv` to create the environment.

## Edit the JavaScript/TypeScript frontend
Install Node.js 22+. Open a second terminal from the project root:

```powershell
cd frontend
npm ci
npm run dev
```

Keep Python running on port 8000; open http://127.0.0.1:5173. Vite connects `/api` to Python. Use `127.0.0.1` consistently in the browser. On Windows, if PowerShell blocks `npm.ps1`, run `npm.cmd ci` and `npm.cmd run dev`, or use VS Code's Command Prompt terminal profile.

After editing, stop Vite with Ctrl+C and run:

```powershell
npm run build
```

Restart the Python server and view the new production build at port 8000.

## Run API tests
In the backend terminal after stopping the server:

```powershell
.venv\Scripts\python.exe -m pytest -q
```

Tests use temporary databases. Browser test commands and their verification limits are in the README.

## Create the GitHub repository
Create an empty repository called `fixpath-smart-troubleshooting` on GitHub. Choose Public if you want it on your portfolio. Do not add README, .gitignore or a license on GitHub before pushing, because the project already contains files.

Suggested description:

> A full-stack laptop and router troubleshooting platform with React, TypeScript, FastAPI, branching diagnostics, private repair histories and community solutions.

## Push the project
Open a terminal in the project root (the folder with `backend` and `frontend`, not inside either). If currently in backend or frontend, use `cd ..`.

Replace the identity and YOUR_USERNAME below:

```powershell
git init
git config user.name "Your Name"
git config user.email "your-email@example.com"
git add .
git status
```

Confirm that `.venv`, `node_modules`, `.env`, `.local_jwt_secret` and `.db` files are not staged. Built `frontend/dist` is ignored; GitHub users build it from source.

```powershell
git commit -m "Build FixPath full-stack troubleshooting platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/fixpath-smart-troubleshooting.git
git push -u origin main
```

Sign in through your browser if prompted. Do not put a password/token in commands or code. If Git is not recognized, install Git, then restart VS Code.

If origin already exists, inspect `git remote -v`. Correct it intentionally with `git remote set-url origin YOUR_URL`. If the GitHub repository already has commits, clone it to a different folder, copy these source files into it, review and commit; do not force-push over existing history.

## Future changes

```powershell
git add .
git commit -m "Improve troubleshooting experience"
git push
```

## Back up your local records
Stop the server before copying `backend/fixpath.db`. Preserve `backend/.local_jwt_secret` privately if you want existing session tokens to remain valid across a restore. Never upload these to a public repository. A lost signing key logs users out but does not delete their accounts or records.

## Deploy later
Streamlit Cloud and GitHub Pages do not run this FastAPI service. Use a Python/container host with PostgreSQL and HTTPS. The README contains production environment settings and a Docker setup, with unverified deployment steps explicitly marked.
