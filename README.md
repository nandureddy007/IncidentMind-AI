# IncidentMind AI ✳

An institutional memory-powered incident response agent for Site Reliability Engineers (SRE) and DevOps teams, built for **HackwithHyderabad 3.0**.

IncidentMind AI turns postmortems into active operational knowledge. When production incidents occur, it compares active symptoms against past resolved outages, generates evidence-based root-cause hypotheses, surfaces historical matches, recommends remediation checklists, and captures new postmortems directly back into memory.

---

## Architecture Stack

- **Backend**: Python 3.10+, FastAPI, SQLite (persisted incident memory), Pydantic v2, Uvicorn
- **Frontend**: React 18, Vite 6, Modern DevOps Command Center CSS
- **Deployment**:
  - Backend: Render Web Service via `render.yaml`
  - Frontend: Vercel SPA via `vercel.json`

---

## Quick Start (Run Locally on Windows / VS Code)

### Prerequisites
- Python 3.10+ (via `py` launcher or `python`)
- Node.js 20+

### 1. Start Backend API
Open a terminal in the project directory:
```powershell
cd backend
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload
```
- API Endpoint: `http://127.0.0.1:8000`
- Interactive API Docs (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Liveness Probe: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### 2. Start Frontend
Open a second terminal window:
```powershell
cd frontend
npm install
npm run dev
```
- Open your browser to the local URL (usually `http://localhost:5173`).

---

## 3-Minute Hackathon Demo Flow

1. **Inspect Historical Seed Data**:
   - Notice the preloaded resolved incidents in memory (Payment API, Auth Service, Inventory API).
2. **Analyze an Incident**:
   - Click **Analyze →** on `Payment API`.
   - Inspect the surfaced 100% historical match and the past resolution: *"Raised pool size from 50 to 100..."*.
3. **Report a New Active Incident**:
   - Click **＋ Report incident**.
   - Service: `Payment API`
   - Severity: `Critical (P1)`
   - Environment: `Production`
   - Error: `Database connection timeout: pool exhausted under high transaction throughput`
   - Submit the form.
4. **Trigger AI Diagnosis**:
   - Click **Analyze →** on the newly created ticket.
   - Observe how the recall engine matches tokens, calculates confidence score, and structures advisory actions.
5. **Continuous Learning (Resolve & Remember)**:
   - Edit or confirm the root cause and resolution in the right panel.
   - Click **✓ Resolve & Remember Postmortem**.
   - Notice the status updates to `resolved` and becomes an active memory for all subsequent incidents.

---

## Cloud Deployment

### 1. Deploy Backend to Render
1. Push this repository to GitHub.
2. Log into [Render](https://render.com) and click **New +** → **Blueprint**.
3. Select your GitHub repository. Render will automatically detect `render.yaml`.
4. Copy the assigned URL (e.g., `https://incidentmind-api.onrender.com`).
5. Confirm by testing `https://incidentmind-api.onrender.com/health`.

### 2. Deploy Frontend to Vercel
1. Log into [Vercel](https://vercel.com) and import your GitHub repository.
2. Select `frontend` as the **Root Directory**.
3. Choose framework preset **Vite**.
4. Under **Environment Variables**, set:
   - `VITE_API_URL` = `https://incidentmind-api.onrender.com` (no trailing slash).
5. Deploy and verify the live dashboard.

---

## Team Division (5 Members)

- **Member 1 (Lead)**: AI Similarity Engine & Hypothesis Formulation
- **Member 2**: FastAPI Application & Incident Memory Persistence
- **Member 3**: React 18 Command Center & Responsive UI
- **Member 4**: DevOps, Render Blueprint, Vercel SPA & GitHub Setup
- **Member 5**: Testing, Realistic Incident Datasets, Presentation & Demo Video
