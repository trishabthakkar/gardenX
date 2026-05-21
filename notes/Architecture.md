# Architecture

High-level system design decisions and technical principles.

## Overview

The system is split into three layers:

1. **Client** — React SPA served by Vite; talks only to the [[Backend]] via REST
2. **Backend** — Express API; stateless, no session; delegates persistence to [[Database]]
3. **Infrastructure** — see [[Deployment]] for hosting and CI/CD

## Key Decisions

### No ORM

We write raw SQL. ORMs paper over differences that matter at scale (index hints, CTEs, upserts). Documented in [[Database]].

### Auth is a sidecar

[[Authentication]] runs as a separate service. The main API trusts a JWT; it never touches credentials. Keeps the blast radius small.

### Feature flags over branches

Long-lived feature branches cause merge pain. We gate unfinished work behind runtime flags instead. See [[Deployment]] for the flag service.

## ADRs

| # | Decision | Status |
|---|---|---|
| 001 | REST over GraphQL | Accepted |
| 002 | Postgres over MongoDB | Accepted |
| 003 | JWT stateless auth | Accepted |
| 004 | Server-side rendering | Rejected |

See [[API Design]] for REST conventions that follow from ADR-001.

## Open Questions

- Caching layer: Redis in front of [[Database]], or HTTP cache headers only?
- Should [[Frontend]] own its own BFF or call the main API directly?

#architecture #decisions #system-design
