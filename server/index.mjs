import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import session from 'express-session'
import passport from 'passport'
import { generateSync } from 'otplib'
import { seedIfEmpty, TOTP_SECRET } from './seed.mjs'
import './auth.mjs'
import sessionsRouter from './routes/sessions.mjs'
import seatsRouter from './routes/seats.mjs'
import reservationsRouter from './routes/reservations.mjs'
import usersRouter from './routes/users.mjs'

const app = express()
const port = 3001

await seedIfEmpty()

app.use(morgan('dev'))
app.use(express.json())
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true
  })
)

app.use(
  session({
    // Fallback matches server/.env.example — required so sessions still work on a fresh clone where .env (gitignored) is absent.
    secret: process.env.SESSION_SECRET || 'theater-reservation-secret',
    resave: false,
    saveUninitialized: false
  })
)

app.use(passport.initialize())
app.use(passport.session())

app.use('/api/sessions', sessionsRouter)
app.use('/api/seats', seatsRouter)
app.use('/api/reservations', reservationsRouter)
app.use('/api/users', usersRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Dev convenience: print the currently-valid TOTP code so admins can be
// verified without setting up an authenticator app (secret per REQUIREMENTS.md).
if (process.env.NODE_ENV !== 'production') {
  const logTotp = () => console.log(`[dev] current TOTP code: ${generateSync({ secret: TOTP_SECRET, type: 'totp' })}`)
  logTotp()
  setInterval(logTotp, 30 * 1000)
}

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`))
