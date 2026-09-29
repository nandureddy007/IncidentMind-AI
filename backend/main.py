from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import sqlite3
import json
import os
import uuid

DB_PATH = os.getenv("DB_PATH", "incidentmind.db")

app = FastAPI(
    title="IncidentMind AI API",
    version="1.0.0",
    description="Institutional Memory-Powered Incident Response Engine for SRE and DevOps teams"
)

origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with db() as c:
        c.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id TEXT PRIMARY KEY,
                service TEXT,
                severity TEXT,
                environment TEXT,
                error TEXT,
                root_cause TEXT,
                resolution TEXT,
                status TEXT,
                created_at TEXT,
                resolved_at TEXT
            )
        """)
        count = c.execute("SELECT COUNT(*) FROM incidents").fetchone()[0]
        if count == 0:
            seeds = [
                (
                    "Payment API",
                    "critical",
                    "production",
                    "Database connection timeout: pool exhausted under high transaction throughput",
                    "Database connection pool exhaustion due to slow queries holding idle connections",
                    "Raised pool size from 50 to 100, enabled statement timeouts, and restarted payment workers",
                ),
                (
                    "Auth Service",
                    "high",
                    "production",
                    "JWT validation latency spike and intermittent 503 Service Unavailable",
                    "Expired signing-key cache after automated secret rotation",
                    "Refreshed public key cache, increased TTL to 24h, and restarted auth pods",
                ),
                (
                    "Inventory API",
                    "medium",
                    "staging",
                    "Redis connection refused: Error connecting to redis-cluster:6379",
                    "Redis service restart during scheduled node maintenance",
                    "Restarted Redis sentinel cluster and verified health check connectivity",
                ),
            ]
            for s, sev, env, err, cause, fix in seeds:
                c.execute(
                    "INSERT INTO incidents VALUES (?,?,?,?,?,?,?,?,?,?)",
                    (
                        str(uuid.uuid4())[:8],
                        s,
                        sev,
                        env,
                        err,
                        cause,
                        fix,
                        "resolved",
                        datetime.utcnow().isoformat(),
                        datetime.utcnow().isoformat(),
                    ),
                )

# Initialize database and seed on startup
init_db()

class IncidentIn(BaseModel):
    service: str
    severity: str = "medium"
    environment: str = "production"
    error: str

class ResolveIn(BaseModel):
    root_cause: str
    resolution: str

@app.get("/")
def root():
    return {
        "name": "IncidentMind AI API",
        "status": "operational",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
def health():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

@app.get("/incidents")
def list_incidents():
    with db() as c:
        rows = c.execute("SELECT * FROM incidents ORDER BY created_at DESC").fetchall()
        return [dict(r) for r in rows]

@app.post("/incidents")
def create_incident(x: IncidentIn):
    if not x.service.strip() or not x.error.strip():
        raise HTTPException(status_code=400, detail="Service and error details are required")
    iid = str(uuid.uuid4())[:8]
    with db() as c:
        c.execute(
            "INSERT INTO incidents VALUES (?,?,?,?,?,?,?,?,?,?)",
            (
                iid,
                x.service.strip(),
                x.severity.lower(),
                x.environment.lower(),
                x.error.strip(),
                "",
                "",
                "open",
                datetime.utcnow().isoformat(),
                None,
            ),
        )
    return {"id": iid, "status": "created", "message": f"Incident {iid} registered in triage"}

@app.get("/incidents/{iid}")
def get_incident(iid: str):
    with db() as c:
        r = c.execute("SELECT * FROM incidents WHERE id=?", (iid,)).fetchone()
        if not r:
            raise HTTPException(status_code=404, detail="Incident not found")
        return dict(r)

def tokens(s: str):
    clean = "".join(ch if ch.isalnum() or ch.isspace() else " " for ch in s)
    return set(w.lower() for w in clean.split() if len(w) > 2)

@app.post("/incidents/{iid}/analyze")
def analyze_incident(iid: str):
    with db() as c:
        cur = c.execute("SELECT * FROM incidents WHERE id=?", (iid,)).fetchone()
        if not cur:
            raise HTTPException(status_code=404, detail="Incident not found")
        
        resolved_rows = c.execute(
            "SELECT * FROM incidents WHERE status='resolved' AND id!=?", (iid,)
        ).fetchall()

    query_tokens = tokens(f"{cur['service']} {cur['error']} {cur['environment']}")
    matches = []

    for r in resolved_rows:
        candidate_tokens = tokens(f"{r['service']} {r['error']} {r['root_cause']}")
        intersection = query_tokens & candidate_tokens
        union = query_tokens | candidate_tokens
        score = len(intersection) / max(1, len(union))
        if score > 0:
            matches.append((score, dict(r)))

    matches.sort(key=lambda x: x[0], reverse=True)
    
    best = [
        {
            "id": r["id"],
            "service": r["service"],
            "error": r["error"],
            "root_cause": r["root_cause"],
            "resolution": r["resolution"],
            "similarity": round(score * 100),
        }
        for score, r in matches[:3]
    ]

    if best:
        cause = best[0]["root_cause"]
        confidence = min(0.95, round(0.50 + (best[0]["similarity"] / 100 * 0.45), 2))
        actions = [
            f"Apply previous resolution: {best[0]['resolution']}",
            f"Check {cur['service']} metrics and application logs around incident start time.",
            "Verify recent CI/CD deployments and configuration updates in the target environment.",
        ]
    else:
        cause = "Insufficient historical match. Investigate runtime logs, recent deployments, and dependency health."
        confidence = 0.35
        actions = [
            "Check service and infrastructure logs for the earliest failing component.",
            "Inspect CPU, memory, database connection pool, and dependent downstream services.",
            "Review configuration changes and environment variables introduced in the last 24 hours.",
        ]

    return {
        "incident_id": iid,
        "summary": f"{cur['service']} in {cur['environment']}: {cur['error']}",
        "possible_root_cause": cause,
        "confidence": confidence,
        "similar_incidents": best,
        "recommended_actions": actions,
        "memory_source": f"IncidentMind Memory Store ({len(resolved_rows)} historical postmortems indexed)",
        "safety_note": "Advisory hypothesis grounded in past postmortems. Validate in staging before executing production remediations.",
    }

@app.post("/incidents/{iid}/resolve")
def resolve_incident(iid: str, x: ResolveIn):
    if not x.root_cause.strip() or not x.resolution.strip():
        raise HTTPException(status_code=400, detail="Confirmed root cause and resolution are required")
    with db() as c:
        cur = c.execute("SELECT id FROM incidents WHERE id=?", (iid,)).fetchone()
        if not cur:
            raise HTTPException(status_code=404, detail="Incident not found")
        c.execute(
            """UPDATE incidents 
               SET root_cause=?, resolution=?, status='resolved', resolved_at=? 
               WHERE id=?""",
            (x.root_cause.strip(), x.resolution.strip(), datetime.utcnow().isoformat(), iid),
        )
    return {
        "status": "resolved",
        "incident_id": iid,
        "message": "Postmortem saved to IncidentMind institutional memory for future recall.",
    }
