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
        <div className="login-card">
            <div className="login-emblem">
              <FontAwesomeIcon icon={faMasksTheater} />
            </div>

            <p className="login-eyebrow">{eyebrow}</p>
            <h1>{heading}</h1>

            {error && (
              <div className="alert alert-danger py-2 small" role="alert">
                {error}
              </div>
            )}

            {step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit}>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    id="username"
                    type="text"
                    className="form-control"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <input
                    id="password"
                    type="password"
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="d-grid mt-4">
                  <button type="submit" className="btn btn-primary">
                    <FontAwesomeIcon icon={faRightToBracket} className="me-2" />
                    Sign in
                  </button>
                </div>
              </form>
            )}

            {step === 'adminChoice' && (
              <>
                <p className="text-muted small">
                  Your account has admin privileges. Proceeding as admin requires a one-time TOTP code from your authenticator.
                </p>
                <div className="d-grid gap-2 mt-3">
                  <button type="button" className="btn btn-primary" onClick={() => setStep('totp')}>
                    <FontAwesomeIcon icon={faShield} className="me-2" />
                    Proceed as admin
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')}>
                    <FontAwesomeIcon icon={faArrowRight} className="me-2" />
                    Continue as regular user
                  </button>
                </div>
              </>
            )}

            {step === 'totp' && (
              <form onSubmit={handleTotpSubmit}>
                <div className="login-divider">One-time code</div>
                <div className="mb-3">
                  <label htmlFor="code" className="form-label">TOTP code</label>
                  <input
                    id="code"
                    type="text"
                    className="form-control"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
                <div className="d-grid gap-2 mt-3">
                  <button type="submit" className="btn btn-primary">
                    <FontAwesomeIcon icon={faShield} className="me-2" />
                    Verify
                  </button>
                  <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
        </div>
      </div>
    </div>
  )
}

export default Login
