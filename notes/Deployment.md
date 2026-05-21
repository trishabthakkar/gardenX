# Deployment

Infrastructure, CI/CD pipeline, and operational runbook.

## Hosting

| Service | Provider |
|---|---|
| API ([[Backend]]) | Railway — auto-deploy from `main` |
| [[Frontend]] | Vercel — preview deploys per PR |
| [[Database]] | Supabase Postgres (managed) |
| Secrets | Railway environment variables |
| CDN / reverse proxy | Cloudflare |

## CI Pipeline (GitHub Actions)

```
on: push to any branch

jobs:
  lint      → eslint + tsc --noEmit
  test      → vitest unit + playwright e2e (see [[Testing]])
  build     → vite build, tsc -b
  deploy    → only on main branch
```

PRs are blocked from merging if any job fails.

## Environment Variables

```
DATABASE_URL        postgres://...
JWT_SECRET          64-byte random hex
REFRESH_SECRET      64-byte random hex
ALLOWED_ORIGINS     https://app.example.com
```

Never commit these. Rotate `JWT_SECRET` if a token is suspected leaked — this invalidates all active sessions.

## Feature Flags

Runtime flags stored in a `feature_flags` table in [[Database]]. Toggle via admin API without redeploying. Useful for [[Frontend]] feature rollouts.

## Rollback

Railway keeps the last 10 successful deploys. Rollback is one click in the dashboard. Database migrations are append-only (no `DROP` without a compensating migration), so API and DB versions can be mismatched briefly.

## Monitoring

- Uptime: Better Uptime pinging `/health` every 60 seconds
- Errors: Sentry (both [[Frontend]] and [[Backend]])
- [[Performance]] metrics: Grafana dashboard over Railway metrics

#deployment #infrastructure #cicd #devops
