import { useContext, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMasksTheater,
  faMap,
  faClipboardList,
  faUser,
  faArrowRightFromBracket,
  faArrowRightToBracket,
  faSun,
  faMoon,
  faShield,
} from '@fortawesome/free-solid-svg-icons'
import { AuthContext } from '../context/AuthContext'

function Sidebar() {
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

  const handleLogout = () => logout().catch(() => {})
  const isActiveAdmin = user?.isAdmin && user?.isTotpVerified

  return (
    <aside className="app-sidebar">
      <Link to="/" className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <FontAwesomeIcon icon={faMasksTheater} />
        </div>
        <div className="sidebar-brand-text">
          <span className="sidebar-brand-name">Theater</span>
          <span className="sidebar-brand-sub">Box Office</span>
        </div>
      </Link>

      <nav className="sidebar-nav">
        <Link to="/" className={`sidebar-link${pathname === '/' ? ' active' : ''}`}>
          <FontAwesomeIcon icon={faMap} fixedWidth />
          <span>Seat map</span>
        </Link>
        {!loading && user && (
          <Link
            to="/reservations"
            className={`sidebar-link${pathname === '/reservations' ? ' active' : ''}`}
          >
            <FontAwesomeIcon icon={faClipboardList} fixedWidth />
            <span>{isActiveAdmin ? 'Manage reservations' : 'My reservations'}</span>
          </Link>
        )}
      </nav>

      <div className="sidebar-footer">
        {!loading && user ? (
          <>
            <div className="sidebar-user">
              <FontAwesomeIcon icon={faUser} className="sidebar-user-icon" />
              <span className="sidebar-user-name">{user.name}</span>
              {user.isAdmin && (
                <span
                  className={`badge ${isActiveAdmin ? 'badge-accent' : ''}`}
                  title={isActiveAdmin ? 'TOTP-verified admin' : 'Admin — not verified this session'}
                >
                  <FontAwesomeIcon icon={faShield} />
                </span>
              )}
            </div>
            <button type="button" className="sidebar-action" onClick={handleLogout}>
              <FontAwesomeIcon icon={faArrowRightFromBracket} fixedWidth />
              <span>Logout</span>
            </button>
          </>
        ) : !loading && (
          <Link
            to="/login"
            className={`sidebar-action${pathname === '/login' ? ' active' : ''}`}
          >
            <FontAwesomeIcon icon={faArrowRightToBracket} fixedWidth />
            <span>Login</span>
          </Link>
        )}
        <button
          type="button"
          className="sidebar-action sidebar-theme"
          onClick={() => setIsDark((d) => !d)}
        >
          <FontAwesomeIcon icon={isDark ? faSun : faMoon} fixedWidth />
          <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
