import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import session from 'express-session'
import passport from 'passport'
import { seedIfEmpty } from './seed.mjs'
import './auth.mjs'
import sessionsRouter from './routes/sessions.mjs'

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
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
)

app.use(passport.initialize())
app.use(passport.session())

app.use('/api/sessions', sessionsRouter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.listen(port, () => console.log(`Server listening on http://localhost:${port}`))
