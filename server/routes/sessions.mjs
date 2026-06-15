import express from 'express'
import passport from 'passport'
import { verifySync } from 'otplib'
import { isLoggedIn } from '../auth.mjs'

const router = express.Router()

const userView = (req) => ({
  id: req.user.id,
  username: req.user.username,
  name: req.user.name,
  isAdmin: !!req.user.is_admin,
  isTotpVerified: !!req.session.totpVerified
})

router.post('/', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({error: info?.message || 'Login failed' });
    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json(userView(req));
    });
  })(req, res, next);
});

router.get('/current', isLoggedIn, (req, res) => res.json(userView(req)))

router.delete('/current', isLoggedIn, (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.sendStatus(204);
    });
  });
});
router.post('/totp', isLoggedIn, (req, res) => {
  if (!req.user.totp_secret) return res.status(400).json({ error: 'TOTP not enabled for this user' })
  const { valid } = verifySync({ secret: req.user.totp_secret, token: req.body.code })
  if (!valid) return res.status(401).json({ error: 'Invalid TOTP code' })
  req.session.totpVerified = true
  res.json(userView(req))
})

export default router
