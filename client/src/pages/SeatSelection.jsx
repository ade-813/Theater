import { useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faChair, faXmark, faCheck, faClock } from '@fortawesome/free-solid-svg-icons'
import SeatMap from '../components/SeatMap'
import SeatLegend from '../components/SeatLegend'
import Proscenium from '../components/Proscenium'
import Toast from '../components/Toast'
import { AuthContext } from '../context/AuthContext'
import { getSeats } from '../api/seats'
import { getReservations, createReservation } from '../api/reservations'
import { getShow } from '../api/shows'

const fmtDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })

function SeatSelection() {
  const { showId, dateId } = useParams()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useContext(AuthContext)

  const showDateId = Number(dateId)

  const [seats, setSeats] = useState([])
  const [show, setShow] = useState(null)
  const [showDate, setShowDate] = useState(null)
  const [reservations, setReservations] = useState([])
  const [selectedSeatIds, setSelectedSeatIds] = useState(new Set())
  const [toast, setToast] = useState(null)
  const [count, setCount] = useState('1')
  const [category, setCategory] = useState('normal')
  const [submitting, setSubmitting] = useState(false)

  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    getShow(showId)
      .then((s) => {
        setShow(s)
        const d = s.dates.find((x) => x.id === showDateId)
        if (!d) { navigate(`/shows/${showId}`); return }
        setShowDate(d)
      })
      .catch(() => navigate('/'))
  }, [showId, showDateId, navigate])

  useEffect(() => {
    getSeats(showDateId).then(setSeats).catch(() => {})
  }, [showDateId])

  useEffect(() => {
    if (authLoading || !user) return
    getReservations().then(setReservations).catch(() => {})
  }, [user, authLoading])

  const ownSeatIds = useMemo(() => {
    const ids = new Set()
    if (!user) return ids
    for (const r of reservations)
      if (r.showDateId === showDateId)
        for (const s of r.seats) ids.add(s.id)
    return ids
  }, [user, reservations, showDateId])

  const toggleSeat = (seat) =>
    setSelectedSeatIds((cur) => {
      const next = new Set(cur)
      if (next.has(seat.id)) next.delete(seat.id)
      else next.add(seat.id)
      return next
    })

  const refresh = () => {
    getSeats(showDateId).then(setSeats).catch(() => {})
    getReservations().then(setReservations).catch(() => {})
  }

  const handleSelectionSubmit = (e) => {
    e.preventDefault()
    if (selectedSeatIds.size === 0) return
    setSubmitting(true)
    createReservation({ showDateId, seatIds: [...selectedSeatIds] })
      .then(() => {
        showToast('success', `${selectedSeatIds.size} seat(s) reserved!`)
        setSelectedSeatIds(new Set())
        refresh()
      })
      .catch((err) =>
        showToast('error', err.response?.data?.error || 'Unable to complete reservation')
      )
      .finally(() => setSubmitting(false))
  }

  const handleCategorySubmit = (e) => {
    e.preventDefault()
    const n = Number(count)
    if (!Number.isInteger(n) || n <= 0) {
      showToast('error', 'Enter a positive number of seats')
      return
    }
    setSubmitting(true)
    createReservation({ showDateId, count: n, category })
      .then(() => {
        showToast('success', `Reserved ${n} ${category} seat(s)!`)
        refresh()
      })
      .catch((err) =>
        showToast('error', err.response?.data?.error || 'Unable to complete reservation')
      )
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="page-seat-selection">
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      <div className="seat-selection-header">
        <button className="btn-back" onClick={() => navigate(`/shows/${showId}`)}>
          <FontAwesomeIcon icon={faArrowLeft} />
          Back
        </button>
        {show && showDate && (
          <div className="seat-selection-info">
            <h1 className="seat-selection-title">{show.title}</h1>
            <span className="seat-selection-date">
              {fmtDate(showDate.date)}
              <span>·</span>
              {showDate.time}–{showDate.endTime}
              <span>·</span>
              <FontAwesomeIcon icon={faClock} />
              {show.duration} min
            </span>
          </div>
        )}
      </div>

      <div className="seat-selection-body">
        <aside className="ss-sidebar">
          <div className="card">
            <div className="card-body">
              <p className="panel-label">Legend</p>
              <SeatLegend showOwn={ownSeatIds.size > 0} showSelected={!!user} />
            </div>
          </div>

          {user ? (
            <>
              <form className="card" onSubmit={handleSelectionSubmit}>
                <div className="card-body">
                  <p className="panel-label">Reserve selected</p>
                  <p className="text-muted small mb-3">
                    {selectedSeatIds.size === 0
                      ? 'Click seats on the map to select.'
                      : `${selectedSeatIds.size} seat(s) selected.`}
                  </p>
                  <div className="d-flex gap-2">
                    <button
                      type="submit"
                      className="btn btn-primary btn-sm"
                      disabled={selectedSeatIds.size === 0 || submitting}
                    >
                      <FontAwesomeIcon icon={faChair} className="me-1" />
                      Reserve
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setSelectedSeatIds(new Set())}
                      disabled={selectedSeatIds.size === 0}
                    >
                      <FontAwesomeIcon icon={faXmark} />
                    </button>
                  </div>
                </div>
              </form>

              <form className="card" onSubmit={handleCategorySubmit}>
                <div className="card-body">
                  <p className="panel-label">Assign by category</p>
                  <div className="mb-3">
                    <label htmlFor="seat-count" className="form-label">Number of seats</label>
                    <input
                      id="seat-count"
                      type="number"
                      min="1"
                      className="form-control form-control-sm"
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="seat-category" className="form-label">Category</label>
                    <select
                      id="seat-category"
                      className="form-select form-select-sm"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="normal">Normal</option>
                      <option value="premium">Premium</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={submitting}
                  >
                    <FontAwesomeIcon icon={faCheck} className="me-1" />
                    Reserve
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="card">
              <div className="card-body">
                <p className="text-muted small mb-3">Sign in to reserve a seat.</p>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => navigate('/login')}
                >
                  Sign in
                </button>
              </div>
            </div>
          )}
        </aside>

        <div className="ss-main">
          <SeatMap
            seats={seats}
            ownSeatIds={ownSeatIds}
            selectedSeatIds={selectedSeatIds}
            onSeatClick={user ? toggleSeat : undefined}
          />
          <Proscenium />
        </div>
      </div>
    </div>
  )
}

export default SeatSelection
