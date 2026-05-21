# API Design

REST conventions, versioning, and response shape standards.

## Base URL

```
https://api.example.com/v1
```

Version in the path, not a header. Breaking changes bump the version; the old version stays live for 6 months.

## Resource Naming

- Plural nouns: `/notes`, `/users`, `/tags`
- Nested for ownership: `/users/:id/notes`
- Actions that don't map to CRUD use verbs: `/notes/:id/publish`

## HTTP Methods

| Method | Use | Idempotent |
|---|---|---|
| GET | Read | Yes |
| POST | Create | No |
| PUT | Replace (full) | Yes |
| PATCH | Update (partial) | Yes |
| DELETE | Remove | Yes |

We use PATCH more than PUT — clients rarely send the full resource.

## Response Shape

```json
{
  "data": { ... },
  "meta": { "total": 42, "page": 1 }
}
```

Errors:

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Note not found"
  }
}
```

## Status Codes

| Code | When |
|---|---|
| 200 | Success with body |
| 201 | Created |
| 204 | Success, no body (DELETE) |
| 400 | Bad request (validation failure) |
| 401 | Not authenticated |
| 403 | Authenticated but not authorized |
| 404 | Resource not found |
| 409 | Conflict (duplicate) |
| 429 | Rate limited |
| 500 | Server error |

## Authentication

Every request (except `/auth/*`) requires `Authorization: Bearer <token>`. See [[Authentication]].

## Pagination

Cursor-based for lists, not offset. Offset pagination breaks under concurrent writes.

```json
{
  "data": [...],
  "meta": { "nextCursor": "eyJpZCI6...", "hasMore": true }
}
```

Decided alongside [[Architecture]] ADR-001. See [[Backend]] for implementation.

#api #rest #design #conventions
