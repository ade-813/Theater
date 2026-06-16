import { useContext, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

function Navbar() {
  const { user, loading, logout } = useContext(AuthContext)
  const { pathname } = useLocation()

  const [isDark, setIsDark] = useState(() => {
    const stored = localStorage.getItem('theme')
    const dark = stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    return dark
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  const handleLogout = () => {
    logout().catch(() => {})
  }

  const reservationsLabel = user?.isAdmin && user?.isTotpVerified ? 'Manage reservations' : 'My reservations'

  return (
    <nav className="navbar">
      <Link to="/" className={`navbar-brand${pathname === '/' ? ' active' : ''}`}>Theater</Link>
      <div className="navbar-links">
        {!loading && user && (
          <Link to="/reservations" className={pathname === '/reservations' ? 'active' : ''}>
            {reservationsLabel}
          </Link>
        )}
        {!loading && user && (
          <span className="navbar-user">
            {user.name}
            {user.isAdmin && (
              <span className={`badge ${user.isTotpVerified ? 'badge-accent' : ''}`}>
                {user.isTotpVerified ? 'Admin active' : 'Admin'}
              </span>
            )}
          </span>
        )}
        {!loading && user && (
          <button type="button" className="btn" onClick={handleLogout}>
            Logout
          </button>
        )}
        {!loading && !user && (
          <Link to="/login" className={pathname === '/login' ? 'active' : ''}>
            Login
          </Link>
        )}
        <button type="button" className="btn btn-theme" onClick={() => setIsDark((d) => !d)}>
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </nav>
  )
}

export default Navbar
