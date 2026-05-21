# Backend

Express API — routing, middleware, and service layer conventions.

## Stack

- **Node.js 22** + **Express 4**
- **TypeScript** (compiled with `tsc`, not ts-node in production)
- **Postgres** via `pg` — no ORM. See [[Database]] for schema.
- **JWT** for auth — see [[Authentication]]

## Request Lifecycle

```
Request
  → rate-limit middleware
  → auth middleware (verifies JWT, attaches req.user)
  → validation middleware (zod schema per route)
  → route handler
  → service layer (pure functions, no req/res)
  → database layer (parameterised queries only)
Response
```

## Error Handling

All errors bubble up to a single error handler registered last. Route handlers never send 500s directly — they throw, and the handler formats the response.

```js
// service throws
throw new AppError(404, 'Note not found')

// error handler catches
app.use((err, req, res, next) => {
  res.status(err.status ?? 500).json({ error: err.message })
})
```

## Route Conventions

Follow [[API Design]] for naming, versioning, and response shapes.

## Secrets

Never in code or `.env` committed to git. Pulled from the secrets manager at startup. See [[Deployment]] for the provider.

## Related

- [[Architecture]] — why Express over Fastify/Hono
- [[Testing]] — integration test setup with a real Postgres instance

#backend #nodejs #express #api
