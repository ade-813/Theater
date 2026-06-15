import { createContext, useState } from 'react'

const AuthContext = createContext()

const AuthContextProvider = ({ children }) => {
  // user: null when logged out, otherwise { id, username, name, isAdmin, isTotpVerified }
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  return (
    <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export { AuthContext, AuthContextProvider }

