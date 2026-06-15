import { useContext, useEffect, useMemo, useState } from 'react'
import Navbar from '../components/Navbar'
import SeatMap from '../components/SeatMap'
import { AuthContext } from '../context/AuthContext'
import { getSeats } from '../api/seats'
import { getReservations, updateReservation, deleteReservation } from '../api/reservations'
import { getUsers } from '../api/users'

const MARKER_COUNT = 5

function toggleId(set, id) {
  const next = new Set(set)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

function Reservations() {
  const { user } = useContext(AuthContext)
  const [seats, setSeats] = useState([])
  const [reservations, setReservations] = useState([])
  const [users, setUsers] = useState([])
  const [viewedUserId, setViewedUserId] = useState(user.id)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [selectedSeatIds, setSelectedSeatIds] = useState(new Set())
  const [removeSeatIds, setRemoveSeatIds] = useState(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const canManageOthers = user.isAdmin && user.isTotpVerified

  useEffect(() => {
    getSeats().then(setSeats).catch(() => setError('Unable to load the seat map'))
  }, [])

  useEffect(() => {
    if (!canManageOthers) return
    getUsers().then(setUsers).catch(() => setUsers([]))
  }, [canManageOthers])

  useEffect(() => {
    getReservations(viewedUserId === user.id ? undefined : viewedUserId)
      .then(setReservations)
      .catch(() => setReservations([]))
  }, [viewedUserId, user.id])

  const refresh = () => {
    getSeats().then(setSeats).catch(() => setError('Unable to load the seat map'))
    getReservations(viewedUserId === user.id ? undefined : viewedUserId)
      .then(setReservations)
      .catch(() => setReservations([]))
  }

  const reservationMarkers = useMemo(() => {
    const markers = new Map()
    reservations.forEach((reservation, index) => {
      for (const seat of reservation.seats) markers.set(seat.id, index % MARKER_COUNT)
    })
    return markers
  }, [reservations])

  const removableSeatIds = useMemo(() => {
    const ids = new Set()
    const reservation = reservations.find((r) => r.id === editingId)
    if (reservation) for (const seat of reservation.seats) ids.add(seat.id)
    return ids
  }, [editingId, reservations])

  const handleSeatClick = (seat) => {
    if (removableSeatIds.has(seat.id)) setRemoveSeatIds((current) => toggleId(current, seat.id))
    else if (seat.status === 'available') setSelectedSeatIds((current) => toggleId(current, seat.id))
  }

  const handleActionError = (err, fallback) => {
    setFeedback({ type: 'error', text: err.response?.data?.error || fallback })
  }

  const startEdit = (reservationId) => {
    setEditingId(reservationId)
    setSelectedSeatIds(new Set())
    setRemoveSeatIds(new Set())
    setConfirmDeleteId(null)
    setFeedback(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setSelectedSeatIds(new Set())
    setRemoveSeatIds(new Set())
  }

  const handleSaveEdit = () => {
    if (selectedSeatIds.size === 0 && removeSeatIds.size === 0) {
      cancelEdit()
      return
    }
    setSubmitting(true)
    updateReservation(editingId, { addSeatIds: [...selectedSeatIds], removeSeatIds: [...removeSeatIds] })
      .then(() => {
        setFeedback({ type: 'success', text: 'Reservation updated' })
        cancelEdit()
        refresh()
      })
      .catch((err) => handleActionError(err, 'Unable to update the reservation'))
      .finally(() => setSubmitting(false))
  }

  const handleDelete = (id) => {
    setSubmitting(true)
    deleteReservation(id)
      .then(() => {
        setFeedback({ type: 'success', text: 'Reservation deleted' })
        setConfirmDeleteId(null)
        if (editingId === id) cancelEdit()
        refresh()
      })
      .catch((err) => handleActionError(err, 'Unable to delete the reservation'))
      .finally(() => setSubmitting(false))
  }

  const handleUserChange = (event) => {
    setViewedUserId(Number(event.target.value))
    cancelEdit()
    setConfirmDeleteId(null)
    setFeedback(null)
  }

  return (
    <>
      <Navbar />
      <main className="page page-wide">
        <h1>My reservations</h1>
        {error && <p className="alert alert-error">{error}</p>}
        {feedback && (
          <p className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
            {feedback.text}
          </p>
        )}

        {canManageOthers && (
          <div className="field">
            <label htmlFor="user-picker">Managing reservations for</label>
            <select id="user-picker" value={viewedUserId} onChange={handleUserChange}>
              <option value={user.id}>{user.name} (you)</option>
              {users.filter((u) => u.id !== user.id).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}

        {editingId !== null && (
          <p className="text-muted">
            {selectedSeatIds.size > 0 || removeSeatIds.size > 0
              ? `${selectedSeatIds.size} seat(s) to add, ${removeSeatIds.size} to remove.`
              : 'Click a highlighted seat to remove it, or an available seat to add it.'}
          </p>
        )}

        <SeatMap
          seats={seats}
          reservationMarkers={reservationMarkers}
          removableSeatIds={removableSeatIds}
          pendingRemoveSeatIds={removeSeatIds}
          selectedSeatIds={selectedSeatIds}
          onSeatClick={editingId !== null ? handleSeatClick : undefined}
        />

        <div className="reservation-section">
          {reservations.length === 0 ? (
            <p className="text-muted">No reservations yet.</p>
          ) : (
            <ul className="reservation-list">
              {reservations.map((reservation, index) => (
                <li className="reservation-item" key={reservation.id}>
                  <div className="reservation-item-header">
                    <span className={`reservation-marker seat-marker-${index % MARKER_COUNT}`} aria-hidden="true" />
                    <span>
                      Reservation #{reservation.id} - {reservation.seats.length} seat(s) -{' '}
                      {new Date(reservation.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-muted">
                    {reservation.seats.map((seat) => `${seat.row}${seat.number}`).join(', ')}
                  </p>

                  {editingId === reservation.id ? (
                    <div className="btn-row">
                      <button type="button" className="btn btn-primary" onClick={handleSaveEdit} disabled={submitting}>
                        Save changes
                      </button>
                      <button type="button" className="btn" onClick={cancelEdit} disabled={submitting}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="btn-row">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => startEdit(reservation.id)}
                        disabled={editingId !== null || confirmDeleteId !== null}
                      >
                        Edit
                      </button>
                      {confirmDeleteId === reservation.id ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => handleDelete(reservation.id)}
                            disabled={submitting}
                          >
                            Confirm delete
                          </button>
                          <button type="button" className="btn" onClick={() => setConfirmDeleteId(null)} disabled={submitting}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn"
                          onClick={() => setConfirmDeleteId(reservation.id)}
                          disabled={editingId !== null}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </>
  )
}

export default Reservations
