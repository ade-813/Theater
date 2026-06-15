import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { AuthContext } from '../context/AuthContext'

function Login() {
  const { login, verifyTotp } = useContext(AuthContext)
  const navigate = useNavigate()

  // step: 'credentials' -> 'adminChoice' (admin-capable, not yet TOTP-verified) -> 'totp'
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

  return (
    <>
      <Navbar />
      <main className="page">
        <h1>Login</h1>

        {error && <p className="alert alert-error">{error}</p>}

        {step === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit}>
            <div className="field">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
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
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">Login</button>
          </form>
        )}

        {step === 'adminChoice' && (
          <div>
            <p>
              This account can act as admin for the current session. Acting as
              admin requires a one-time TOTP code.
            </p>
            <div className="btn-row">
              <button type="button" className="btn btn-primary" onClick={() => setStep('totp')}>
                Act as admin
              </button>
              <button type="button" className="btn" onClick={() => navigate('/')}>
                Continue as regular user
              </button>
            </div>
          </div>
        )}

        {step === 'totp' && (
          <form onSubmit={handleTotpSubmit}>
            <div className="field">
              <label htmlFor="code">TOTP code</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoFocus
                required
              />
            </div>
            <div className="btn-row">
              <button type="submit" className="btn btn-primary">Verify</button>
              <button type="button" className="btn" onClick={() => navigate('/')}>
                Cancel, continue as regular user
              </button>
            </div>
          </form>
        )}
      </main>
    </>
  )
}

export default Login
