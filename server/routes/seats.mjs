import express from 'express'
import { dbGet, dbAll } from '../db.mjs'

const router = express.Router()

// GET /api/seats?showDateId=N — availability scoped to a show date
// GET /api/seats — plain seat list without reservation status
router.get('/', async (req, res, next) => {
  try {
    const { showDateId } = req.query

    if (showDateId) {
      const showDate = await dbGet('SELECT id FROM show_dates WHERE id = ?', [Number(showDateId)])
      if (!showDate) return res.status(404).json({ error: 'Show date not found' })

      const seats = await dbAll(
        `SELECT s.id, s.row_label AS row, s.seat_number AS number, s.category,
           CASE WHEN rs.seat_id IS NOT NULL THEN 'reserved' ELSE 'available' END AS status
         FROM seats s
         LEFT JOIN reservation_seats rs ON rs.seat_id = s.id
           AND rs.reservation_id IN (
             SELECT id FROM reservations WHERE show_date_id = ?
           )
         ORDER BY s.row_label, s.seat_number`,
        [Number(showDateId)]
      )
      return res.json(seats)
    }

    const seats = await dbAll(
      'SELECT id, row_label AS row, seat_number AS number, category FROM seats ORDER BY row_label, seat_number'
    )
    res.json(seats)
  } catch (err) {
    next(err)
  }
})

export default router
