import express from 'express'
import { dbAll } from '../db.mjs'
import { isAdmin } from '../auth.mjs'

const router = express.Router()

// TOTP-verified admins use this to pick whose reservations to manage.
router.get('/', isAdmin, async (req, res, next) => {
  try {
    const users = await dbAll('SELECT id, username, name FROM users ORDER BY name')
    res.json(users)
  } catch (err) {
    next(err)
  }
})

export default router
