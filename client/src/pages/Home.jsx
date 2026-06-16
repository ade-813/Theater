import { useContext, useEffect, useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark, faChair } from '@fortawesome/free-solid-svg-icons'
import SeatMap from '../components/SeatMap'
import SeatLegend from '../components/SeatLegend'
import Proscenium from '../components/Proscenium'
import { AuthContext } from '../context/AuthContext'
import { getSeats } from '../api/seats'
import { getReservations, createReservation } from '../api/reservations'

function Home() {
  const { user, loading } = useContext(AuthContext)
  const [seats, setSeats] = useState([])
  const [reservations, setReservations] = useState([])
  const [error, setError] = useState('')
  const [selectedSeatIds, setSelectedSeatIds] = useState(new Set())
  const [feedback, setFeedback] = useState(null)
  const [count, setCount] = useState('1')
  const [category, setCategory] = useState('normal')
  const [submitting, setSubmitting] = useState(false)

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

  const toggleSeat = (seat) => {
    setSelectedSeatIds((current) => {
      const next = new Set(current)
      if (next.has(seat.id)) next.delete(seat.id)
      else next.add(seat.id)
      return next
    })
  }

  const refreshAfterReservation = () => {
    getSeats().then(setSeats).catch(() => setError('Unable to load the seat map'))
    getReservations().then(setReservations).catch(() => setReservations([]))
  }

  const handleReservationError = (err) => {
    setFeedback({ type: 'error', text: err.response?.data?.error || 'Unable to complete the reservation' })
  }

  const handleSelectionSubmit = (event) => {
    event.preventDefault()
    if (selectedSeatIds.size === 0) return
    setSubmitting(true)
    createReservation({ seatIds: [...selectedSeatIds] })
      .then(() => {
        setFeedback({ type: 'success', text: 'Reservation created' })
        setSelectedSeatIds(new Set())
        refreshAfterReservation()
      })
      .catch(handleReservationError)
      .finally(() => setSubmitting(false))
  }

  const handleCategorySubmit = (event) => {
    event.preventDefault()
    const n = Number(count)
    if (!Number.isInteger(n) || n <= 0) {
      setFeedback({ type: 'error', text: 'Enter a positive number of seats' })
      return
    }
    setSubmitting(true)
    createReservation({ count: n, category })
      .then(() => {
        setFeedback({ type: 'success', text: `Reserved ${n} ${category} seat(s)` })
        refreshAfterReservation()
      })
      .catch(handleReservationError)
      .finally(() => setSubmitting(false))
  }

  return (
    <main className="page page-wide">
      <h1>Seat map</h1>

      {error && <p className="alert alert-error">{error}</p>}
      {feedback && (
        <p className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </p>
      )}

      <div className="layout">
        <aside className="sidebar">
          <div className="panel">
            <h2 className="panel-title">Legend</h2>
            <SeatLegend showOwn={ownSeatIds.size > 0} showSelected={!!user} />
          </div>

          {user ? (
            <>
              <form className="panel" onSubmit={handleSelectionSubmit}>
                <h2 className="panel-title">Reserve selected</h2>
                <p className="text-muted">
                  {selectedSeatIds.size === 0
                    ? 'Click seats on the map to select them.'
                    : `${selectedSeatIds.size} seat(s) selected.`}
                </p>
                <div className="btn-row">
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={selectedSeatIds.size === 0 || submitting}
                  >
                    <FontAwesomeIcon icon={faChair} />
                    Reserve
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => setSelectedSeatIds(new Set())}
                    disabled={selectedSeatIds.size === 0}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                    Clear
                  </button>
                </div>
              </form>

              <form className="panel" onSubmit={handleCategorySubmit}>
                <h2 className="panel-title">Assign by category</h2>
                <div className="field">
                  <label htmlFor="seat-count">Number of seats</label>
                  <input
                    id="seat-count"
                    type="number"
                    min="1"
                    value={count}
                    onChange={(e) => setCount(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="seat-category">Category</label>
                  <select
                    id="seat-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="normal">Normal</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  <FontAwesomeIcon icon={faCheck} />
                  Reserve
                </button>
              </form>
            </>
          ) : (
            <div className="panel">
              <p className="text-muted">Log in to reserve a seat.</p>
            </div>
          )}
        </aside>

        <div className="main-panel">
          <SeatMap
            seats={seats}
            ownSeatIds={ownSeatIds}
            selectedSeatIds={selectedSeatIds}
            onSeatClick={user ? toggleSeat : undefined}
          />
          <Proscenium />
        </div>
      </div>
    </main>
  )
}

export default Home
