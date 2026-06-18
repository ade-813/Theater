import { useContext, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMasksTheater,
  faHouse,
  faFilm,
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
    const dark = stored ? stored === 'dark' : true
    const theme = dark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-bs-theme', theme)
    return dark
  })

  useEffect(() => {
    const theme = isDark ? 'dark' : 'light'
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.setAttribute('data-bs-theme', theme)
    localStorage.setItem('theme', theme)
  }, [isDark])

  const handleLogout = () => logout().catch(() => {})
  const isActiveAdmin = user?.isAdmin && user?.isTotpVerified

  const isBrowseActive = pathname === '/shows' || pathname.startsWith('/shows/')

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
        <Link
          to="/"
          className={`sidebar-link${pathname === '/' ? ' active' : ''}`}
        >
          <FontAwesomeIcon icon={faHouse} fixedWidth />
          <span>Home</span>
        </Link>

        <Link
          to="/shows"
          className={`sidebar-link${isBrowseActive ? ' active' : ''}`}
        >
          <FontAwesomeIcon icon={faFilm} fixedWidth />
          <span>Browse</span>
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

        {!loading && isActiveAdmin && (
          <Link
            to="/admin"
            className={`sidebar-link${pathname === '/admin' ? ' active' : ''}`}
          >
            <FontAwesomeIcon icon={faShield} fixedWidth />
            <span>Admin</span>
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
                  className={`badge badge-accent${isActiveAdmin ? '' : ' opacity-50'}`}
                  title={isActiveAdmin ? 'TOTP-verified admin' : 'Admin - not verified this session'}
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
            <span>Sign in</span>
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
