# Server

## API Routes

All routes are prefixed with `/api`. Routes marked **auth** require a logged-in session (`isLoggedIn`); routes marked **admin** additionally require `is_admin` and a TOTP-verified session (`isAdmin`).

### Sessions

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| POST | `/api/sessions` | `{ username, password }` | Logs in via passport-local; `{ id, username, name, isAdmin, isTotpVerified }`, 401 on bad credentials |
| GET | `/api/sessions/current` | — | Logged-in user (same shape as above), 401 if not logged in |
| DELETE | `/api/sessions/current` | — | 204; logs out and destroys the session |
| POST | `/api/sessions/totp` | `{ code }` | Verifies the TOTP code against the user's stored secret; sets `isTotpVerified: true` for the session on success, 401 if invalid |

### Shows (public)

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/shows` | — | Array of `{ id, title, description, posterUrl, duration, dates: [{ id, date, time, endTime }] }` |
| GET | `/api/shows/:id` | — | Single show with same shape, 404 if not found |

### Seats

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/seats` | — | Full theater layout; `[{ id, row, number, category }]`, no auth required |
| GET | `/api/seats?showDateId=N` | — | Same layout with `status` (`available`/`reserved`) scoped to the given show date |

### Reservations

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/reservations` | — | Current user's reservations; **auth** required. Admin (TOTP-verified) may add `?userId=` to view another user's. Returns `[{ id, userId, showDateId, date, time, endTime, showTitle, createdAt, seats: [{ id, row, number, category }] }]` |
| POST | `/api/reservations` | `{ showDateId, seatIds }` or `{ showDateId, count, category }` | Creates a reservation; `201` with the created reservation or `400`/`409` with a descriptive error (seat doesn't exist, already reserved, cooldown, not enough seats, ...) |
| PUT | `/api/reservations/:id` | `{ addSeatIds, removeSeatIds }` | Adds/removes seats (owner or TOTP-verified admin); removed seats start a 40s cooldown for the owner |
| DELETE | `/api/reservations/:id` | — | 204; frees the seats and starts a 40s cooldown for the owner on each |

### Users

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/users` | — | **admin** — `[{ id, username, name }]`; used by the admin UI to pick whose reservations to manage |

### Admin — Shows & Dates

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/admin/shows` | — | **admin** — same shape as `GET /api/shows` |
| POST | `/api/admin/shows` | `{ title, duration, description?, posterUrl? }` | **admin** — 201 + `{ id, title, description, posterUrl, duration, dates: [] }` |
| DELETE | `/api/admin/shows/:id` | — | **admin** — 204; 409 if the show has existing reservations |
| POST | `/api/admin/shows/:showId/dates` | `{ date, time }` | **admin** — computes `end_time = start + duration`; enforces full time-range overlap check across all show dates; 201 + `{ id, showId, date, time, endTime }`, 409 on overlap |
| DELETE | `/api/admin/shows/:showId/dates/:dateId` | — | **admin** — 204; 409 if the show date has existing reservations |

### Admin — Reservations

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/admin/reservations` | — | **admin** — all reservations with seats; optionally filter with `?showDateId=N` |
| DELETE | `/api/admin/reservations/:id` | — | **admin** — 204; hard-delete without cooldown |
