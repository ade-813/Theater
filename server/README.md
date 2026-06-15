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

### Reservations

| Method | Endpoint | Body | Returns |
| --- | --- | --- | --- |
| GET | `/api/reservations` | — | current user's reservations with seats; admin (TOTP-verified) may add `?userId=` to view another user's |
| POST | `/api/reservations` | `{seatIds}` or `{count, category}` | creates a reservation for the current user; direct seat list is validated (exists, free, not in cooldown), or seats are auto-assigned (same row preferred); `201` with the created reservation, or `400`/`409` with a descriptive error |
| PUT | `/api/reservations/:id` | `{addSeatIds, removeSeatIds}` | adds/removes seats on a reservation (owner or TOTP-verified admin); re-validates added seats; removed seats start a 40s cooldown for the owner |
| DELETE | `/api/reservations/:id` | — | deletes the reservation (owner or TOTP-verified admin), frees its seats and starts a 40s cooldown for the owner on each |
