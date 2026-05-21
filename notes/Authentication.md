# Authentication

Auth flows, JWT handling, and security conventions.

## Approach

Stateless JWT issued on login. No server-side sessions. Token lifetime: **15 minutes** access, **7 days** refresh.

Decided in [[Architecture]] ADR-003. Revisit if we need server-side revocation (e.g. "log out all devices").

## Flow

```
1. POST /auth/login  { email, password }
   → verify bcrypt hash against [[Database]]
   → issue { accessToken, refreshToken }

2. Client stores accessToken in memory (not localStorage)
   refreshToken in httpOnly cookie

3. On 401 → POST /auth/refresh with cookie
   → issue new accessToken

4. POST /auth/logout → clear cookie server-side
```

## JWT Claims

```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "member",
  "iat": 1700000000,
  "exp": 1700000900
}
```

The [[Backend]] auth middleware validates signature and expiry before any route handler runs.

## Password Rules

- Minimum 12 characters
- bcrypt with cost factor 12
- No maximum length (hash the input, not the password)
- Rate-limit login attempts: 5 per minute per IP

## OAuth

Google and GitHub are wired up via Passport.js. The callback exchanges the OAuth token for our own JWT, keeping auth uniform across the [[Backend]].

## Security Headers

Set by the [[Deployment]] reverse proxy:
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy`

#authentication #security #jwt #auth
