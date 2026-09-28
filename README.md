# IncidentMind AI

A full-stack incident response hackathon prototype. It lets a team report incidents, analyze them against resolved incident history, view likely causes and recommended diagnostic steps, and save a postmortem for future recall.

## Stack
- React + Vite frontend
- FastAPI backend
- SQLite demo incident memory (seeded with sample incidents)
- Optional deployment: Render (API) + Vercel (frontend)

> This starter's matching engine is a transparent keyword-overlap baseline, not a production RCA model. The UI/API mark recommendations as advisory. Add a configured Hindsight service and LLM for the full memory-agent implementation before claiming those integrations are live.

## Run locally (Windows / VS Code)
Install Python 3.10+ and Node.js 20+.

### 1. Backend
Open terminal in VS Code:
```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```
API: http://127.0.0.1:8000  
Interactive API docs: http://127.0.0.1:8000/docs

To enable LLM-assisted analysis, set `OPENAI_API_KEY` before starting the backend. Retrieved resolved incidents are included as context; this is retrieval-augmented generation, not model fine-tuning. Incident text and retrieved postmortems are sent to OpenAI, so only enable this when your data-handling policy permits it. Without a key or if the provider is unavailable, analysis falls back to the local keyword baseline. The model defaults to `gpt-4o-mini`; override it with `OPENAI_MODEL`.

```powershell
$env:OPENAI_API_KEY = "your-key"
uvicorn main:app --reload
```

For Render, add `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in the service's environment settings. Keep the key on the backend and never add it to the frontend or commit it to Git.

If PowerShell blocks activation, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` in that terminal, then activate again.

### 2. Frontend (second terminal)
```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```
Open the local URL Vite prints, usually http://localhost:5173.

## Demo flow
1. Open the dashboard; sample resolved incidents are preloaded.
2. Click Analyze on Payment API to see historical memory matches.
3. Report a new incident (e.g. `Payment API`, `Database connection timeout: pool exhausted`).
4. Analyze, review the matches, edit confirmed root cause and resolution, then click **Resolve & remember**.
5. Analyze a later similar incident and show the saved postmortem in historical matches.

## Push to GitHub
Create an empty repository on GitHub, then from the project root:
```bash
git init
git add .
git commit -m "Initial IncidentMind AI project"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/incidentmind-ai.git
git push -u origin main
```
Never commit `.env`, API keys, tokens, or production incident secrets.

## Deploy backend to Render
1. Push this repository to GitHub.
2. In Render, choose **New + → Blueprint** and select the repository. Render should detect `backend/render.yaml`.
3. Once deployed, copy the API service URL and verify `/health` and `/docs`.
4. For persistent data, attach a Render persistent disk and configure `DB_PATH` to a path on that disk (SQLite data on an ephemeral filesystem can reset on redeploy). For multi-user production, use managed PostgreSQL.

## Deploy frontend to Vercel
1. Import the same GitHub repository in Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: Vite.
4. Add environment variable `VITE_API_URL` = your Render backend URL (no trailing slash).
5. Deploy and redeploy after changing environment variables.

## CORS
For a public deployment, set backend `CORS_ORIGINS` to your exact Vercel URL (comma-separated for previews if needed), rather than `*`. The current blueprint uses `*` for quick hackathon setup.

## Suggested next upgrades
- Replace SQLite with managed PostgreSQL for persistent multi-user use.
- Integrate Hindsight retain/recall/reflect with credentials held only on the backend.
- Integrate an LLM for structured RCA, with citations to retrieved incident IDs.
- Add authentication, role-based access, audit logs, rate limits, log redaction, and approval-gated runbook execution.
