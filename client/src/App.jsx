import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Reservations from './pages/Reservations'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthContextProvider } from './context/AuthContext'

function App() {
  return (
    <AuthContextProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/reservations"
          element={
            <ProtectedRoute>
              <Reservations />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthContextProvider>
  )
}

export default App
