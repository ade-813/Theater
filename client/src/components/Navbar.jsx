import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

function Navbar() {
  const { user, loading, logout } = useContext(AuthContext)
  const { pathname } = useLocation()

  const handleLogout = () => {
    logout().catch(() => {})
  }

  return (
    <nav className="navbar">
      <Link to="/" className={`navbar-brand${pathname === '/' ? ' active' : ''}`}>Theater</Link>
      <div className="navbar-links">
        {!loading && user && (
          <Link to="/reservations" className={pathname === '/reservations' ? 'active' : ''}>
            My reservations
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
      </div>
    </nav>
  )
}

export default Navbar
