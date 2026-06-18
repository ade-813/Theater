import { Route, Routes } from 'react-router-dom'
import Browse from './pages/Browse'
import ShowDetail from './pages/ShowDetail'
import SeatSelection from './pages/SeatSelection'
import Login from './pages/Login'
import Reservations from './pages/Reservations'
import Admin from './pages/Admin'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Sidebar from './components/Sidebar'
import { AuthContextProvider } from './context/AuthContext'

function App() {
  return (
    <AuthContextProvider>
      <div className="app-shell">
        <Sidebar />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<Browse />} />
            <Route path="/shows/:showId" element={<ShowDetail />} />
            <Route path="/shows/:showId/dates/:dateId" element={<SeatSelection />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/reservations"
              element={
                <ProtectedRoute>
                  <Reservations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </AuthContextProvider>
  )
}

export default App
