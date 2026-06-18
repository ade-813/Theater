import bcrypt from 'bcrypt'
import dayjs from 'dayjs'
import { dbReady, dbGet, dbRun } from './db.mjs'

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

const USERS = [
  { username: 'john',  name: 'John Smith',    password: 'johnpw1',  isAdmin: 0, totpSecret: null },
  { username: 'mark',  name: 'Mark Johnson',  password: 'markpw1',  isAdmin: 1, totpSecret: TOTP_SECRET },
  { username: 'sara',  name: 'Sara Davis',    password: 'sarapw1',  isAdmin: 0, totpSecret: null },
  { username: 'tom',   name: 'Tom Wilson',    password: 'tompw1',   isAdmin: 1, totpSecret: TOTP_SECRET },
  { username: 'mira', name: 'Mira Rossi',   password: 'mirapw1', isAdmin: 0, totpSecret: null },
  { username: 'bob',   name: 'Bob Ferrari',   password: 'bobpw1',   isAdmin: 0, totpSecret: null },
  { username: 'emma',  name: 'Emma Bianchi',  password: 'emmapw1',  isAdmin: 0, totpSecret: null }
]

const SHOWS = [
  {
    title: 'Hamlet',
    description: 'Shakespeare\'s timeless tragedy of the Prince of Denmark.',
    posterUrl: 'https://assets.mycast.io/posters/hamlet-2025-fan-casting-poster-130308-large.jpg',
    duration: 150,
    dates: [
      { date: '2026-07-10', time: '19:00' },
      { date: '2026-07-11', time: '19:00' },
      { date: '2026-07-12', time: '15:00' }
    ]
  },
  {
    title: 'The Phantom of the Opera',
    description: 'A legendary musical of love and obsession beneath the Paris Opera House.',
    posterUrl: 'https://www.limelighttheatre.com.au/wp-content/uploads/2020/05/Phantom-of-the-Opera-Poster.jpg',
    duration: 150,
    dates: [
      { date: '2026-07-12', time: '19:00' },
      { date: '2026-07-18', time: '19:00' },
      { date: '2026-07-19', time: '19:00' }
    ]
  },
  {
    title: 'A Midsummer Night\'s Dream',
    description: 'Shakespeare\'s enchanting comedy of love, magic, and mischief.',
    posterUrl: 'https://m.media-amazon.com/images/I/71plvG7VRiL._SL1400_.jpg',
    duration: 120,
    dates: [
      { date: '2026-08-01', time: '19:00' },
      { date: '2026-08-02', time: '15:00' },
      { date: '2026-08-02', time: '19:00' }
    ]
  },
  {
    title: 'Romeo and Juliet',
    description: 'The world\'s greatest love story - passion, rivalry, and tragedy in Verona.',
    posterUrl: 'https://i.pinimg.com/736x/7d/a4/d0/7da4d06680ac41dbdcc0c02977b68de1.jpg',
    duration: 135,
    dates: [
      { date: '2026-08-14', time: '19:30' },
      { date: '2026-08-15', time: '19:30' },
      { date: '2026-08-16', time: '15:00' },
      { date: '2026-08-22', time: '19:30' }
    ]
  },
  {
    title: 'The Nutcracker',
    description: 'Tchaikovsky\'s beloved Christmas ballet - a magical journey through the Land of Sweets.',
    posterUrl: 'https://media.fathomentertainment.com/image/826249444369/image_lgkl8ik22d7s1dtgqnkobc4i3q/-S400-Fwebp',
    duration: 95,
    dates: [
      { date: '2026-12-19', time: '18:00' },
      { date: '2026-12-20', time: '15:00' },
      { date: '2026-12-20', time: '19:00' },
      { date: '2026-12-21', time: '15:00' },
      { date: '2026-12-21', time: '19:00' }
    ]
  }
]

const computeEndTime = (date, time, duration) =>
  dayjs(`${date}T${time}`).add(duration, 'minute').format('HH:mm')

const RESERVATIONS = [
  // john - Hamlet
  { username: 'john',  showIndex: 0, dateIndex: 0, seats: [['C', 1], ['C', 2]] },
  { username: 'john',  showIndex: 0, dateIndex: 1, seats: [['A', 5]] },
  // mark - Phantom
  { username: 'mark',  showIndex: 1, dateIndex: 0, seats: [['D', 3], ['D', 4], ['D', 5]] },
  { username: 'mark',  showIndex: 1, dateIndex: 1, seats: [['H', 10], ['H', 11]] },
  // john - Midsummer
  { username: 'john',  showIndex: 2, dateIndex: 0, seats: [['B', 2], ['B', 3], ['B', 4]] },
  { username: 'john',  showIndex: 2, dateIndex: 2, seats: [['E', 7], ['E', 8]] },
  // mark - Romeo and Juliet
  { username: 'mark',  showIndex: 3, dateIndex: 0, seats: [['A', 1], ['A', 2], ['A', 3]] },
  { username: 'mark',  showIndex: 3, dateIndex: 2, seats: [['F', 5], ['F', 6], ['F', 7], ['F', 8]] },
  // john - Nutcracker
  { username: 'john',  showIndex: 4, dateIndex: 0, seats: [['G', 3], ['G', 4]] },
  { username: 'john',  showIndex: 4, dateIndex: 2, seats: [['C', 8], ['C', 9], ['C', 10]] },
  // mark - Nutcracker
  { username: 'mark',  showIndex: 4, dateIndex: 1, seats: [['B', 6], ['B', 7], ['B', 8]] },
  // sara - Hamlet + Midsummer
  { username: 'sara',  showIndex: 0, dateIndex: 2, seats: [['D', 7], ['D', 8]] },
  { username: 'sara',  showIndex: 2, dateIndex: 1, seats: [['H', 1], ['H', 2], ['H', 3]] },
  // mira - Phantom + Romeo and Juliet
  { username: 'mira', showIndex: 1, dateIndex: 2, seats: [['A', 8], ['A', 9]] },
  { username: 'mira', showIndex: 3, dateIndex: 1, seats: [['C', 3], ['C', 4], ['C', 5]] },
  { username: 'mira', showIndex: 3, dateIndex: 3, seats: [['E', 1], ['E', 2]] },
  // bob - Midsummer + Nutcracker
  { username: 'bob',   showIndex: 2, dateIndex: 0, seats: [['G', 8], ['G', 9], ['G', 10]] },
  { username: 'bob',   showIndex: 4, dateIndex: 3, seats: [['D', 9], ['D', 10], ['D', 11]] },
  // emma - Hamlet + Romeo and Juliet + Nutcracker
  { username: 'emma',  showIndex: 0, dateIndex: 0, seats: [['F', 3], ['F', 4]] },
  { username: 'emma',  showIndex: 3, dateIndex: 0, seats: [['H', 5], ['H', 6], ['H', 7]] },
  { username: 'emma',  showIndex: 4, dateIndex: 4, seats: [['B', 1], ['B', 2]] },
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

  const showDateIds = []
  for (const show of SHOWS) {
    const { lastID: showId } = await dbRun(
      'INSERT INTO shows (title, description, poster_url, duration) VALUES (?, ?, ?, ?)',
      [show.title, show.description, show.posterUrl, show.duration]
    )
    const dateIds = []
    for (const d of show.dates) {
      const endTime = computeEndTime(d.date, d.time, show.duration)
      const { lastID: dateId } = await dbRun(
        'INSERT INTO show_dates (show_id, date, time, end_time) VALUES (?, ?, ?, ?)',
        [showId, d.date, d.time, endTime]
      )
      dateIds.push(dateId)
    }
    showDateIds.push(dateIds)
  }

  for (const reservation of RESERVATIONS) {
    const showDateId = showDateIds[reservation.showIndex][reservation.dateIndex]
    const { lastID: reservationId } = await dbRun(
      'INSERT INTO reservations (user_id, show_date_id, created_at) VALUES (?, ?, ?)',
      [userIds[reservation.username], showDateId, dayjs().toISOString()]
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

  console.log('Database seeded with theater layout, shows, users and reservations.')
}
