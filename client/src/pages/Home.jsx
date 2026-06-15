import { useContext, useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import SeatMap from '../components/SeatMap'
import { AuthContext } from '../context/AuthContext'
import { getSeats } from '../api/seats'
import { getReservations } from '../api/reservations'

function Home() {
  const { user, loading } = useContext(AuthContext)
  const [seats, setSeats] = useState([])
  const [reservations, setReservations] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getSeats()
      .then(setSeats)
      .catch(() => setError('Unable to load the seat map'))
  }, [])

  useEffect(() => {
    if (loading || !user) return
    getReservations()
      .then(setReservations)
      .catch(() => setReservations([]))
  }, [user, loading])

  const ownSeatIds = useMemo(() => {
    const ids = new Set()
    if (!user) return ids
    for (const reservation of reservations)
      for (const seat of reservation.seats) ids.add(seat.id)
    return ids
  }, [user, reservations])

  return (
    <>
      <Navbar />
      <main className="page page-wide">
        <h1>Theater seat map</h1>
        {error && <p className="alert alert-error">{error}</p>}
        <SeatMap seats={seats} ownSeatIds={ownSeatIds} />
      </main>
    </>
  )
}

export default Home
