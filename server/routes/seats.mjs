import express from 'express'
import { dbAll } from '../db.mjs'

const router = express.Router()

router.get('/', async (req, res, next) => {
  try {
    const seats = await dbAll(`
      SELECT s.id, s.row_label AS row, s.seat_number AS number, s.category,
        CASE WHEN rs.seat_id IS NOT NULL THEN 'reserved' ELSE 'available' END AS status
      FROM seats s
      LEFT JOIN reservation_seats rs ON rs.seat_id = s.id
      ORDER BY s.row_label, s.seat_number
    `)
    res.json(seats)
  } catch (err) {
    next(err)
  }
})

export default router
