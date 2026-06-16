import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Reservations from './pages/Reservations'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import { AuthContextProvider } from './context/AuthContext'

function App() {
  return (
    <AuthContextProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="app-content">
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
        </div>
      </div>
    </AuthContextProvider>
  )
}

export default App
