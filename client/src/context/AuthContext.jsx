import { createContext, useEffect, useState } from 'react'
import { getCurrentUser, login as apiLogin, logout as apiLogout, verifyTotp as apiVerifyTotp } from '../api/auth'

const AuthContext = createContext()

const AuthContextProvider = ({ children }) => {
  // user: null when logged out, otherwise { id, username, name, isAdmin, isTotpVerified }
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (username, password) => {
    const loggedInUser = await apiLogin(username, password)
    setUser(loggedInUser)
    return loggedInUser
  }

  const logout = async () => {
    await apiLogout()
    setUser(null)
  }

  const verifyTotp = async (code) => {
    const verifiedUser = await apiVerifyTotp(code)
    setUser(verifiedUser)
    return verifiedUser
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, verifyTotp }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext, AuthContextProvider }
