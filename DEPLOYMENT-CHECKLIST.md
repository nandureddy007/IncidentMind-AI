# Hackathon Submission & Deployment Checklist

Ensure every item is checked off before submitting to HackwithHyderabad 3.0 judges:

- [ ] **Backend Verified Locally**:
  - `GET /health` returns `{"status":"healthy"}`.
  - `GET /incidents` returns seeded incidents.
  - Interactive Swagger documentation loads at `http://127.0.0.1:8000/docs`.

- [ ] **Frontend Verified Locally**:
  - `npm run dev` boots without console errors.
  - Incidents list renders with severity pills.
  - "＋ Report incident" modal successfully creates an open incident.
  - "Analyze →" triggers recall and surfaces past resolutions.
  - "✓ Resolve & Remember Postmortem" saves confirmed data to the database.

- [ ] **GitHub Repository**:
  - Public repository created.
  - Clean commit history with descriptive messages.
  - Sensitive files (`.env`, `.db`, `.venv/`, `node_modules/`) excluded via `.gitignore`.
  - Comprehensive `README.md` at root.

- [ ] **Render Backend Deployment**:
  - Blueprint deployed via `render.yaml`.
  - Public URL accessible via HTTPS.
  - `/health` endpoint responds with 200 OK.

- [ ] **Vercel Frontend Deployment**:
  - Root directory pointed to `frontend`.
  - Environment variable `VITE_API_URL` set to Render backend HTTPS URL.
  - Frontend successfully fetches data from Render backend without CORS errors.

- [ ] **5 Member Articles Published**:
  - Member 1: *From Incident Chaos to Institutional Memory: Building an Incident Response Agent That Learns From the Past*
  - Member 2: *AI-Assisted Root Cause Analysis: Turning Error Messages Into Actionable Incident Intelligence*
  - Member 3: *Designing Continuous Institutional Memory: How IncidentMind AI Retains and Recalls Operational Postmortems*
  - Member 4: *Engineering Resilient Incident Management: Inside the FastAPI and React Architecture of IncidentMind AI*
  - Member 5: *Bridging the SRE Cognitive Load: How IncidentMind AI Transforms On-Call Experience and MTTR*
  - **Crucial**: Confirmed that none of the article titles include the word "Hackathon" as per guidelines.

- [ ] **Submission Deliverables**:
  - GitHub Repo Link
  - Live Frontend App Link (Vercel)
  - Live Backend API / Docs Link (Render)
  - 5 Individual Article URLs
  - 3-Minute Video Demo URL (YouTube/Loom/Drive)
