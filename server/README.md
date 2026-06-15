# Server

## API Routes

### Sessions

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| POST | `/api/sessions` | `{username, password}` | logs in via passport-local; `{id, username, name, isAdmin, isTotpVerified}` |
| GET | `/api/sessions/current` | — | logged-in user (same shape as above) or 401 |
| DELETE | `/api/sessions/current` | — | logs out, destroys the session |
| POST | `/api/sessions/totp` | `{code}` | verifies the TOTP code against the user's stored secret; on success sets `isTotpVerified: true` for the session |

### Seats

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/seats` | — | full theater layout; array of `{id, row, number, category, status}` (`status` is `available` or `reserved`); no auth required |
