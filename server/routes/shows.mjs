import express from 'express'
import { dbGet, dbAll } from '../db.mjs'

const router = express.Router()

// GET /api/shows
router.get('/', async (req, res, next) => {
  try {
    const shows = await dbAll(
      'With start_dates as (SELECT show_id as id, MIN(date) as date FROM show_dates GROUP BY show_id) '+
      'SELECT id, title, description, poster_url AS posterUrl, duration FROM shows ' +
      'LEFT JOIN start_dates USING (id) ORDER BY date ASC '
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

// GET /api/shows/:id
router.get('/:id', async (req, res, next) => {
  try {
    const show = await dbGet(
      'SELECT id, title, description, poster_url AS posterUrl, duration FROM shows WHERE id = ?',
      [req.params.id]
    )
    if (!show) return res.status(404).json({ error: 'Show not found' })
    show.dates = await dbAll(
      'SELECT id, date, time, end_time AS endTime FROM show_dates WHERE show_id = ? ORDER BY date, time',
      [show.id]
    )
    res.json(show)
  } catch (err) {
    next(err)
  }
})

export default router
