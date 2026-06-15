import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

function Navbar() {
  const { user } = useContext(AuthContext)

  return (
    <nav>
      <Link to="/">Theater</Link>
      {user ? (
        <>
          <Link to="/reservations">My reservations</Link>
          <span>Hi, {user.name}</span>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  )
}

export default Navbar
