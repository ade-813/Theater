import sqlite3 from 'sqlite3'

const db = new sqlite3.Database('./theater.db', (err) => {
  if (err) throw err
})

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  is_admin INTEGER NOT NULL DEFAULT 0,
  totp_secret TEXT
);

CREATE TABLE IF NOT EXISTS seats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  row_label TEXT NOT NULL,
  seat_number INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('normal', 'premium')),
  UNIQUE (row_label, seat_number)
);

CREATE TABLE IF NOT EXISTS shows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  poster_url TEXT,
  duration INTEGER NOT NULL DEFAULT 120
);

CREATE TABLE IF NOT EXISTS show_dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  show_id INTEGER NOT NULL REFERENCES shows(id),
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  end_time TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  show_date_id INTEGER NOT NULL REFERENCES show_dates(id),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reservation_seats (
  reservation_id INTEGER NOT NULL REFERENCES reservations(id),
  seat_id INTEGER NOT NULL REFERENCES seats(id),
  PRIMARY KEY (reservation_id, seat_id)
);

CREATE TABLE IF NOT EXISTS seat_cooldowns (
  seat_id INTEGER NOT NULL REFERENCES seats(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  show_date_id INTEGER NOT NULL REFERENCES show_dates(id),
  released_at TEXT NOT NULL,
  PRIMARY KEY (seat_id, user_id, show_date_id)
);
`

export const dbReady = new Promise((resolve, reject) => {
  db.exec(schema, (err) => (err ? reject(err) : resolve()))
})

export const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  })

export const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  })

export const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve({ lastID: this.lastID, changes: this.changes })
    })
  })

export default db
