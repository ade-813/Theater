import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMasksTheater,
  faRightToBracket,
  faShield,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import { AuthContext } from '../context/AuthContext'

const STEPS = {
  credentials: { eyebrow: 'Theater · Box Office', heading: 'Welcome back' },
  adminChoice:  { eyebrow: 'Theater · Admin access', heading: 'Act as admin?' },
  totp:         { eyebrow: 'Theater · Two-factor', heading: 'Verify identity' },
}

function Login() {
  const { login, verifyTotp } = useContext(AuthContext)
  const navigate = useNavigate()

  const [step, setStep] = useState('credentials')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleCredentialsSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const loggedInUser = await login(username, password)
      if (loggedInUser.isAdmin && !loggedInUser.isTotpVerified) {
        setStep('adminChoice')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    }
  }

  const handleTotpSubmit = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await verifyTotp(code)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid TOTP code')
    }
  }

  const { eyebrow, heading } = STEPS[step]

  return (
    <div className="page-login">
      <div className="login-box">
        <div className="login-emblem">
          <FontAwesomeIcon icon={faMasksTheater} />
        </div>

        <p className="login-eyebrow">{eyebrow}</p>
        <h1>{heading}</h1>

        {error && <p className="alert alert-error">{error}</p>}

        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit}>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              <FontAwesomeIcon icon={faRightToBracket} />
              Sign in
            </button>
          </form>
        )}

        {step === 'adminChoice' && (
          <>
            <p className="text-muted">
              Your account has admin privileges. Proceed as admin requires a one-time TOTP code from your authenticator.
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn-primary" onClick={() => setStep('totp')}>
                <FontAwesomeIcon icon={faShield} />
                Proceed as admin
              </button>
              <button type="button" className="btn" onClick={() => navigate('/')}>
                <FontAwesomeIcon icon={faArrowRight} />
                Continue as regular user
              </button>
            </div>
          </>
        )}

        {step === 'totp' && (
          <form onSubmit={handleTotpSubmit}>
            <div className="login-divider">One-time code</div>
            <div className="field">
              <label htmlFor="code">TOTP code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="btn-row">
              <button type="submit" className="btn btn-primary">
                <FontAwesomeIcon icon={faShield} />
                Verify
              </button>
              <button type="button" className="btn" onClick={() => navigate('/')}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default Login
