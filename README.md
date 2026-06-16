# Theater - seat reservation app

A small app for browsing a theater's seat map and managing reservations,
built with React (client) + Express/SQLite (server).

## Running the project

From the project root, in two separate terminals:

```bash
cd server
npm install
node index.mjs --env-file=.env
```

```bash
cd client
npm install
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001 (CORS configured for the client origin, with credentials)

On first run the server creates and seeds `server/theater.db` automatically
(idempotent - safe to restart).

An optional `server/.env` (see `server/.env.example`) can override
`SESSION_SECRET` and `TOTP_SECRET`; both have working fallback defaults baked
in, so the app runs out of the box on a fresh clone with no `.env` file.

### Two-factor authentication (TOTP)

Admin-capable users (`mark`, `tom`) can choose, at login, to "act as admin",
which requires a 6-digit TOTP code generated from the shared TOTP secret
(stored per-user in the `users` table; see `server/.env.example` for the value).

For convenience during development, the server prints the currently valid
code to its console every 30 seconds:

```
[dev] current TOTP code: 123456
```

Copy that value into the "TOTP code" field on the login page (this log is
skipped when `NODE_ENV=production`).

### Seeded users

| Username | Password | Admin-capable (TOTP) |
| -------- | -------- | --------------------- |
| john     | johnpw1  | no                    |
| mark     | markpw1  | yes                   |
| sara     | sarapw1  | no                    |
| tom      | tompw1   | yes                   |

---

## Server-side

### HTTP API

All routes are prefixed with `/api`. Routes marked **auth** require a logged
in session (`isLoggedIn`); routes marked **admin** additionally require
`is_admin` and a TOTP-verified session (`isAdmin`).

| Method & path | Auth | Body / params | Returns |
| --- | --- | --- | --- |
| `GET /api/health` | - | - | `{ status: 'ok' }` |
| `POST /api/sessions` | - | `{ username, password }` | `{ id, username, name, isAdmin, isTotpVerified }`, 401 on bad credentials |
| `GET /api/sessions/current` | auth | - | current user, same shape as above (401 if not logged in) |
| `DELETE /api/sessions/current` | auth | - | 204, destroys the session |
| `POST /api/sessions/totp` | auth | `{ code }` | verifies the TOTP code against the user's stored secret; on success sets `totpVerified` on the session and returns the user object (401 if invalid) |
| `GET /api/seats` | - | - | array of `{ id, row, number, category, status }` for every seat (`status` is `available`/`reserved`) |
| `GET /api/reservations` | auth | optional `?userId=` (admin only, 403 otherwise) | array of `{ id, userId, createdAt, seats: [{ id, row, number, category }] }` for the current user (or `userId`) |
| `POST /api/reservations` | auth | either `{ seatIds: [id, ...] }` (direct selection) or `{ count, category }` (assign by category, same-row preferred) | `201` + created reservation, or `400`/`409` with a descriptive `{ error }` (seat doesn't exist, already reserved, cooldown, not enough seats of category X, ...) |
| `PUT /api/reservations/:id` | auth (owner or admin) | `{ addSeatIds: [...], removeSeatIds: [...] }` | updated reservation `{ id, userId, createdAt, seats }`, or `400`/`403`/`404`/`409` with `{ error }` |
| `DELETE /api/reservations/:id` | auth (owner or admin) | - | 204; frees the seats and starts a 40s re-booking cooldown for the reservation's owner |
| `GET /api/users` | admin | - | array of `{ id, username, name }`, used to pick which user's reservations to manage |

### Database tables (`server/theater.db`, SQLite)

| Table | Purpose | Columns |
| --- | --- | --- |
| `users` | registered users and credentials | `id`, `username` (unique), `name`, `password_hash` (bcrypt), `is_admin`, `totp_secret` (nullable) |
| `seats` | theater layout | `id`, `row_label`, `seat_number`, `category` (`normal`/`premium`), unique on `(row_label, seat_number)` |
| `reservations` | one row per booking | `id`, `user_id`, `created_at` |
| `reservation_seats` | seats belonging to a reservation | `reservation_id`, `seat_id` (composite primary key) |
| `seat_cooldowns` | tracks the 40s re-booking cooldown per user/seat | `seat_id`, `user_id`, `released_at` (composite primary key, latest release wins) |

---

## Client-side

### Routes

| Route | Purpose |
| --- | --- |
| `/` | Seat map (visible to anonymous users); logged-in users can create a reservation by clicking seats directly or by requesting N seats of a category |
| `/login` | Username/password login, with an optional "act as admin" TOTP step for admin-capable users |
| `/reservations` | The current user's reservations, all shown on one seat map (each in its own color); edit (add/remove seats) and delete; TOTP-verified admins can pick another user and manage their reservations the same way |

### Main React components

- `SeatMap` - renders the theater grid from `GET /api/seats`; supports
  highlighting the current user's seats, per-reservation color markers,
  click-to-select/remove, and a legend
- `Navbar` - shows auth state, a link to "My reservations", an admin badge,
  and login/logout
- `Login` - multi-step login form (credentials, then optional TOTP step)
- `Home` - seat map + the two reservation-creation forms (direct selection,
  count + category)
- `Reservations` - reservation list + management map, edit/delete flows, and
  the admin user picker
- `ProtectedRoute` - redirects to `/login` for the `/reservations` route when
  not authenticated
- `AuthContext` - provides `user`/`loading` and `login`/`logout`/`verifyTotp`
  to the rest of the app

---

## Screenshot

-- TODO
