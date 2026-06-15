# Server-side

## API Routes

### Sessions
- `POST /api/sessions` — body `{username, password}`, logs in via passport-local;
  returns `{id, username, name, isAdmin, isTotpVerified}`
- `GET /api/sessions/current` — returns the logged-in user (same shape as above) or 401
- `DELETE /api/sessions/current` — logs out, destroys the session
- `POST /api/sessions/totp` — body `{code}`, verifies the TOTP code against the
  user's stored secret; on success sets `isTotpVerified: true` for the session
