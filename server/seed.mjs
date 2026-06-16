import bcrypt from 'bcrypt'
import dayjs from 'dayjs'
import { dbReady, dbGet, dbRun } from './db.mjs'

// Fallback matches server/.env.example - required so 2FA still works on a
// fresh clone where .env (gitignored) is absent, per REQUIREMENTS.md.
export const TOTP_SECRET = process.env.TOTP_SECRET || 'LXBSMDTMSP2I5XFXIYRGFVWSFI'

// Theater layout: 8 rows, 5 distinct row lengths, rows A & B are premium.
const ROWS = [
  { label: 'A', length: 10, category: 'premium' },
  { label: 'B', length: 10, category: 'premium' },
  { label: 'C', length: 12, category: 'normal' },
  { label: 'D', length: 12, category: 'normal' },
  { label: 'E', length: 14, category: 'normal' },
  { label: 'F', length: 14, category: 'normal' },
  { label: 'G', length: 16, category: 'normal' },
  { label: 'H', length: 18, category: 'normal' }
]

// At least 4 users, exactly 2 admin-capable (each with its own stored TOTP secret).
const USERS = [
  { username: 'john', name: 'John Smith', password: 'johnpw1', isAdmin: 0, totpSecret: null },
  { username: 'mark', name: 'Mark Johnson', password: 'markpw1', isAdmin: 1, totpSecret: TOTP_SECRET },
  { username: 'sara', name: 'Sara Davis', password: 'sarapw1', isAdmin: 0, totpSecret: null },
  { username: 'tom', name: 'Tom Wilson', password: 'tompw1', isAdmin: 1, totpSecret: TOTP_SECRET }
]

// 4 reservations owned by exactly 2 users (1 admin-capable + 1 regular), 8 seats total
// out of 106 -> 98 seats remain unreserved.
const RESERVATIONS = [
  { username: 'john', seats: [['C', 1], ['C', 2]] },
  { username: 'john', seats: [['A', 5]] },
  { username: 'mark', seats: [['D', 3], ['D', 4], ['D', 5]] },
  { username: 'mark', seats: [['H', 10], ['H', 11]] }
]

export async function seedIfEmpty() {
  await dbReady

  const { count } = await dbGet('SELECT COUNT(*) AS count FROM users')
  if (count > 0) return

  for (const row of ROWS) {
    for (let n = 1; n <= row.length; n++) {
      await dbRun('INSERT INTO seats (row_label, seat_number, category) VALUES (?, ?, ?)', [
        row.label,
        n,
        row.category
      ])
    }
  }

  const userIds = {}
  for (const user of USERS) {
    const passwordHash = await bcrypt.hash(user.password, 10)
    const { lastID } = await dbRun(
      'INSERT INTO users (username, name, password_hash, is_admin, totp_secret) VALUES (?, ?, ?, ?, ?)',
      [user.username, user.name, passwordHash, user.isAdmin, user.totpSecret]
    )
    userIds[user.username] = lastID
  }

  for (const reservation of RESERVATIONS) {
    const { lastID: reservationId } = await dbRun(
      'INSERT INTO reservations (user_id, created_at) VALUES (?, ?)',
      [userIds[reservation.username], dayjs().toISOString()]
    )
    for (const [rowLabel, seatNumber] of reservation.seats) {
      const seat = await dbGet('SELECT id FROM seats WHERE row_label = ? AND seat_number = ?', [
        rowLabel,
        seatNumber
      ])
      await dbRun('INSERT INTO reservation_seats (reservation_id, seat_id) VALUES (?, ?)', [
        reservationId,
        seat.id
      ])
    }
  }

  console.log('Database seeded with theater layout, users and reservations.')
}
