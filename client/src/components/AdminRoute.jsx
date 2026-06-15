import { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

function AdminRoute({ children }) {
  const { user, loading } = useContext(AuthContext)

  if (loading) return null

  if (!user || !user.isAdmin || !user.isTotpVerified) {
    return <Navigate to="/" />
  }

  return children
}

export default AdminRoute
