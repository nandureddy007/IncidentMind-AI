# Deployment checklist

- [ ] Backend works locally at `/health` and `/docs`.
- [ ] Frontend works locally and can load incidents.
- [ ] Push repository to GitHub.
- [ ] Deploy backend on Render.
- [ ] Verify Render `/health`.
- [ ] Deploy `frontend/` on Vercel with `VITE_API_URL`.
- [ ] Set Render `CORS_ORIGINS` to the deployed Vercel URL.
- [ ] Verify create → analyze → resolve → analyze-again flow.
- [ ] Confirm persistence: SQLite on Render may reset without a persistent disk; use PostgreSQL for durable deployment.
- [ ] Do not expose API keys or real sensitive production logs.
