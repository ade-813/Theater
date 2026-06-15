import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import bcrypt from 'bcrypt'
import { dbGet } from './db.mjs'

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await dbGet('SELECT * FROM users WHERE username = ?', [username])
      if (!user) return done(null, false, { message: 'Incorrect username or password.' })

      const match = await bcrypt.compare(password, user.password_hash)
      if (!match) return done(null, false, { message: 'Incorrect username or password.' })

      return done(null, user)
    } catch (err) {
      return done(err)
    }
  })
)

passport.serializeUser((user, done) => done(null, user.id))

passport.deserializeUser(async (id, done) => {
  try {
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [id])
    done(null, user)
  } catch (err) {
    done(err)
  }
})

export const isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) return next()
  res.status(401).json({ error: 'Not authenticated' })
}

export const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.is_admin && req.session.totpVerified) return next()
  res.status(403).json({ error: 'Admin access requires TOTP verification' })
}
