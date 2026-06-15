import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

function AdminRoute({ children }) {
  const { user } = useContext(AuthContext)

  if (!user || !user.isAdmin || !user.isTotpVerified) {
    return <Navigate to="/" />
  }

  return children
}

export default AdminRoute
