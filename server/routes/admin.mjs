import express from 'express'
import dayjs from 'dayjs'
import { dbGet, dbAll, dbRun } from '../db.mjs'
import { isAdmin } from '../auth.mjs'

const router = express.Router()

router.use(isAdmin)

router.get('/shows', async (req, res, next) => {
  try {
    const shows = await dbAll(
      'SELECT id, title, description, poster_url AS posterUrl, duration FROM shows ORDER BY title'
    )
    for (const show of shows)
      show.dates = await dbAll(
        'SELECT id, date, time, end_time AS endTime FROM show_dates WHERE show_id = ? ORDER BY date, time',
        [show.id]
      )
    res.json(shows)
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/shows — body: { title, description?, posterUrl?, duration }
router.post('/shows', async (req, res, next) => {
  try {
    const { title, description, posterUrl, duration } = req.body
    if (!title) return res.status(400).json({ error: 'title is required' })
    if (!duration || !Number.isInteger(Number(duration)) || Number(duration) <= 0)
      return res.status(400).json({ error: 'duration (minutes) is required and must be a positive integer' })

    const { lastID } = await dbRun(
      'INSERT INTO shows (title, description, poster_url, duration) VALUES (?, ?, ?, ?)',
      [title, description || null, posterUrl || null, Number(duration)]
    )
    res.status(201).json({
      id: lastID, title,
      description: description || null,
      posterUrl: posterUrl || null,
      duration: Number(duration),
      dates: []
    })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/admin/shows/:id
router.delete('/shows/:id', async (req, res, next) => {
  try {
    const show = await dbGet('SELECT id FROM shows WHERE id = ?', [req.params.id])
    if (!show) return res.status(404).json({ error: 'Show not found' })

    const hasReservations = await dbGet(
      `SELECT 1 FROM reservations r
       JOIN show_dates sd ON sd.id = r.show_date_id
       WHERE sd.show_id = ?`,
      [show.id]
    )
    if (hasReservations)
      return res.status(409).json({ error: 'Cannot delete a show that has existing reservations' })

    await dbRun('DELETE FROM show_dates WHERE show_id = ?', [show.id])
    await dbRun('DELETE FROM shows WHERE id = ?', [show.id])
    res.sendStatus(204)
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/shows/:showId/dates — body: { date, time }
router.post('/shows/:showId/dates', async (req, res, next) => {
  try {
    const show = await dbGet('SELECT id, duration FROM shows WHERE id = ?', [req.params.showId])
    if (!show) return res.status(404).json({ error: 'Show not found' })

    const { date, time } = req.body
    if (!date || !time) return res.status(400).json({ error: 'date and time are required' })

    const newStart = dayjs(`${date}T${time}`)
    if (!newStart.isValid()) return res.status(400).json({ error: 'Invalid date or time format' })

    const newEnd = newStart.add(show.duration, 'minute')
    const endTime = newEnd.format('HH:mm')

    // Range overlap: fetch all existing show_dates and check in JS so midnight-crossing works
    const existing = await dbAll(
      `SELECT sd.id, sd.date, sd.time, sd.end_time, s.title
       FROM show_dates sd JOIN shows s ON s.id = sd.show_id`
    )

    for (const ex of existing) {
      const exStart = dayjs(`${ex.date}T${ex.time}`)
      // If end_time is earlier than start_time the show crosses midnight — add a day
      let exEnd = dayjs(`${ex.date}T${ex.end_time}`)
      if (exEnd.isBefore(exStart)) exEnd = exEnd.add(1, 'day')
      let curEnd = newEnd
      if (curEnd.isBefore(newStart)) curEnd = curEnd.add(1, 'day')
      if (newStart.isBefore(exEnd) && exStart.isBefore(curEnd))
        return res.status(409).json({ error: `Time slot overlaps with "${ex.title}" (${ex.date} ${ex.time}–${ex.end_time})`})
    }
    const { lastID } = await dbRun(
      'INSERT INTO show_dates (show_id, date, time, end_time) VALUES (?, ?, ?, ?)',
      [show.id, date, time, endTime]
    )
    res.status(201).json({ id: lastID, showId: show.id, date, time, endTime })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/admin/shows/:showId/dates/:dateId
router.delete('/shows/:showId/dates/:dateId', async (req, res, next) => {
  try {
    const showDate = await dbGet(
      'SELECT id FROM show_dates WHERE id = ? AND show_id = ?',
      [req.params.dateId, req.params.showId]
    )
    if (!showDate) return res.status(404).json({ error: 'Show date not found' })

    const hasReservations = await dbGet(
      'SELECT 1 FROM reservations WHERE show_date_id = ?',
      [showDate.id]
    )
    if (hasReservations)
      return res.status(409).json({ error: 'Cannot delete a show date that has existing reservations' })

    await dbRun('DELETE FROM show_dates WHERE id = ?', [showDate.id])
    res.sendStatus(204)
  } catch (err) {
    next(err)
  }
})


// GET /api/admin/reservations?showDateId=N
router.get('/reservations', async (req, res, next) => {
  try {
    let sql = `
      SELECT r.id, r.user_id AS userId, r.show_date_id AS showDateId, r.created_at AS createdAt,
             u.username, u.name,
             sd.date, sd.time, sd.end_time AS endTime, s.title AS showTitle
      FROM reservations r
      JOIN users u ON u.id = r.user_id
      JOIN show_dates sd ON sd.id = r.show_date_id
      JOIN shows s ON s.id = sd.show_id
    `
    const params = []
    if (req.query.showDateId) {
      sql += ' WHERE r.show_date_id = ?'
      params.push(Number(req.query.showDateId))
    }
    sql += ' ORDER BY sd.date, sd.time, r.id'

    const reservations = await dbAll(sql, params)
    for (const r of reservations)
      r.seats = await dbAll(
        `SELECT s.id, s.row_label AS row, s.seat_number AS number, s.category
         FROM reservation_seats rs JOIN seats s ON s.id = rs.seat_id
         WHERE rs.reservation_id = ? ORDER BY s.row_label, s.seat_number`,
        [r.id]
      )
    res.json(reservations)
  } catch (err) {
    next(err)
  }
})

// DELETE /api/admin/reservations/:id — admin can delete any reservation
router.delete('/reservations/:id', async (req, res, next) => {
  try {
    const reservation = await dbGet('SELECT id FROM reservations WHERE id = ?', [req.params.id])
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' })
    await dbRun('DELETE FROM reservation_seats WHERE reservation_id = ?', [reservation.id])
    await dbRun('DELETE FROM reservations WHERE id = ?', [reservation.id])
    res.sendStatus(204)
  } catch (err) {
    next(err)
  }
})

export default router
