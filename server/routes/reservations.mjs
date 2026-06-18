import express from 'express'
import dayjs from 'dayjs'
import { dbGet, dbAll, dbRun } from '../db.mjs'
import { isLoggedIn } from '../auth.mjs'

const router = express.Router()

const COOLDOWN_SECONDS = 40

const getSeatsForReservation = (reservationId) =>
  dbAll(
    `SELECT s.id, s.row_label AS row, s.seat_number AS number, s.category
     FROM reservation_seats rs JOIN seats s ON s.id = rs.seat_id
     WHERE rs.reservation_id = ?
     ORDER BY s.row_label, s.seat_number`,
    [reservationId]
  )

const isAuthorized = (req, reservation) =>
  reservation.user_id === req.user.id || (req.user.is_admin && req.session.totpVerified)

const getAvailableSeats = (category, userId, showDateId) =>
  dbAll(
    `SELECT s.id, s.row_label AS row, s.seat_number AS number, s.category
     FROM seats s
     WHERE s.category = ?
       AND s.id NOT IN (
         SELECT rs.seat_id FROM reservation_seats rs
         JOIN reservations r ON r.id = rs.reservation_id
         WHERE r.show_date_id = ?
       )
       AND s.id NOT IN (
         SELECT seat_id FROM seat_cooldowns
         WHERE user_id = ? AND show_date_id = ? AND released_at > ?
       )
     ORDER BY s.row_label, s.seat_number`,
    [category, showDateId, userId, showDateId, dayjs().subtract(COOLDOWN_SECONDS, 'second').toISOString()]
  )

const validateSeatIds = async (seatIds, userId, showDateId) => {
  if (!Array.isArray(seatIds) || seatIds.length === 0)
    throw { status: 400, message: 'seatIds must be a non-empty array' }
  if (new Set(seatIds).size !== seatIds.length)
    throw { status: 400, message: 'Duplicate seat ids in request' }

  const cutoff = dayjs().subtract(COOLDOWN_SECONDS, 'second').toISOString()

  for (const seatId of seatIds) {
    const seat = await dbGet('SELECT * FROM seats WHERE id = ?', [seatId])
    if (!seat) throw { status: 400, message: `Seat ${seatId} does not exist` }

    const reserved = await dbGet(
      `SELECT 1 FROM reservation_seats rs
       JOIN reservations r ON r.id = rs.reservation_id
       WHERE rs.seat_id = ? AND r.show_date_id = ?`,
      [seatId, showDateId]
    )
    if (reserved) throw { status: 409, message: `Seat ${seat.row_label}${seat.seat_number} is already reserved for this show date` }

    const cooldown = await dbGet(
      'SELECT 1 FROM seat_cooldowns WHERE seat_id = ? AND user_id = ? AND show_date_id = ? AND released_at > ?',
      [seatId, userId, showDateId, cutoff]
    )
    if (cooldown) throw { status: 409, message: `Too early to re-reserve seat ${seat.row_label}${seat.seat_number}` }
  }
}

// GET /api/reservations — current user's reservations (admin can pass ?userId=)
router.get('/', isLoggedIn, async (req, res, next) => {
  try {
    let userId = req.user.id
    if (req.query.userId !== undefined) {
      if (!(req.user.is_admin && req.session.totpVerified))
        return res.status(403).json({ error: 'Admin access requires TOTP verification' })
      userId = Number(req.query.userId)
    }
    const reservations = await dbAll(
      `SELECT r.id, r.user_id AS userId, r.show_date_id AS showDateId, r.created_at AS createdAt,
              sd.date, sd.time, sd.end_time AS endTime, s.title AS showTitle
       FROM reservations r
       JOIN show_dates sd ON sd.id = r.show_date_id
       JOIN shows s ON s.id = sd.show_id
       WHERE r.user_id = ?
       ORDER BY r.id`,
      [userId]
    )
    for (const reservation of reservations)
      reservation.seats = await getSeatsForReservation(reservation.id)
    res.json(reservations)
  } catch (err) {
    next(err)
  }
})

// POST /api/reservations — body: { showDateId, seatIds } or { showDateId, count, category }
router.post('/', isLoggedIn, async (req, res, next) => {
  let chosenSeatIds
  try {
    const { showDateId, seatIds, count, category } = req.body
    if (!showDateId) return res.status(400).json({ error: 'showDateId is required' })
    const showDate = await dbGet(
      `SELECT sd.id, sd.date, sd.time, sd.end_time AS endTime, s.title AS showTitle
       FROM show_dates sd JOIN shows s ON s.id = sd.show_id
       WHERE sd.id = ?`,
      [showDateId]
    )
    if (!showDate) return res.status(404).json({ error: 'Show date not found' })
    if (seatIds !== undefined) {
      await validateSeatIds(seatIds, req.user.id, showDateId)
      chosenSeatIds = seatIds
    } else if (count !== undefined && category !== undefined) {
      if (!['normal', 'premium'].includes(category))
        return res.status(400).json({ error: 'category must be "normal" or "premium"' })

      const n = Number(count)
      if (!Number.isInteger(n) || n <= 0)
        return res.status(400).json({ error: 'count must be a positive integer' })

      const available = await getAvailableSeats(category, req.user.id, showDateId)
      if (available.length < n)
        return res.status(409).json({ error: `Not enough seats of category ${category} available` })

      const byRow = {}
      for (const seat of available) {
        if (!byRow[seat.row]) byRow[seat.row] = []
        byRow[seat.row].push(seat)
      }
      const sameRow = Object.values(byRow).find((seats) => seats.length >= n)
      chosenSeatIds = (sameRow || available).slice(0, n).map((s) => s.id)
    } else return res.status(400).json({ error: 'Provide either seatIds or count and category' })

    const createdAt = dayjs().toISOString()
    const { lastID } = await dbRun(
      'INSERT INTO reservations (user_id, show_date_id, created_at) VALUES (?, ?, ?)',
      [req.user.id, showDateId, createdAt]
    )

    for (const seatId of chosenSeatIds)
      await dbRun('INSERT INTO reservation_seats (reservation_id, seat_id) VALUES (?, ?)', [lastID, seatId])

    const seats = await getSeatsForReservation(lastID)
    res.status(201).json({
      id: lastID,
      userId: req.user.id,
      showDateId,
      date: showDate.date,
      time: showDate.time,
      endTime: showDate.endTime,
      showTitle: showDate.showTitle,
      createdAt,
      seats
    })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    next(err)
  }
})

// PUT /api/reservations/:id — add/remove seats
router.put('/:id', isLoggedIn, async (req, res, next) => {
  try {
    const reservation = await dbGet('SELECT * FROM reservations WHERE id = ?', [req.params.id])
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' })
    if (!isAuthorized(req, reservation))
      return res.status(403).json({ error: 'Not authorized to modify this reservation' })

    const addSeatIds = req.body.addSeatIds || []
    const removeSeatIds = req.body.removeSeatIds || []
    if (addSeatIds.length === 0 && removeSeatIds.length === 0)
      return res.status(400).json({ error: 'Provide addSeatIds and/or removeSeatIds' })

    const currentSeatIds = (await getSeatsForReservation(reservation.id)).map((s) => s.id)
    for (const seatId of removeSeatIds)
      if (!currentSeatIds.includes(seatId))
        return res.status(400).json({ error: `Seat ${seatId} is not part of this reservation` })

    const remainingCount = currentSeatIds.length - removeSeatIds.length + addSeatIds.length
    if (remainingCount < 1)
      return res.status(400).json({ error: 'A reservation must contain at least one seat; delete it instead' })

    if (addSeatIds.length > 0) await validateSeatIds(addSeatIds, reservation.user_id, reservation.show_date_id)

    const releasedAt = dayjs().toISOString()
    for (const seatId of removeSeatIds) {
      await dbRun('DELETE FROM reservation_seats WHERE reservation_id = ? AND seat_id = ?', [reservation.id, seatId])
      await dbRun(
        'INSERT OR REPLACE INTO seat_cooldowns (seat_id, user_id, show_date_id, released_at) VALUES (?, ?, ?, ?)',
        [seatId, reservation.user_id, reservation.show_date_id, releasedAt]
      )
    }
    for (const seatId of addSeatIds)
      await dbRun('INSERT INTO reservation_seats (reservation_id, seat_id) VALUES (?, ?)', [reservation.id, seatId])

    const seats = await getSeatsForReservation(reservation.id)
    res.json({ id: reservation.id, userId: reservation.user_id, showDateId: reservation.show_date_id, createdAt: reservation.created_at, seats })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message })
    next(err)
  }
})

// DELETE /api/reservations/:id
router.delete('/:id', isLoggedIn, async (req, res, next) => {
  try {
    const reservation = await dbGet('SELECT * FROM reservations WHERE id = ?', [req.params.id])
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' })
    if (!isAuthorized(req, reservation))
      return res.status(403).json({ error: 'Not authorized to delete this reservation' })

    const seats = await getSeatsForReservation(reservation.id)
    const releasedAt = dayjs().toISOString()
    for (const seat of seats)
      await dbRun(
        'INSERT OR REPLACE INTO seat_cooldowns (seat_id, user_id, show_date_id, released_at) VALUES (?, ?, ?, ?)',
        [seat.id, reservation.user_id, reservation.show_date_id, releasedAt]
      )
    await dbRun('DELETE FROM reservation_seats WHERE reservation_id = ?', [reservation.id])
    await dbRun('DELETE FROM reservations WHERE id = ?', [reservation.id])
    res.sendStatus(204)
  } catch (err) {
    next(err)
  }
})

export default router
