import { useContext, useEffect, useMemo, useState } from 'react'
import SeatMap from '../components/SeatMap'
import SeatLegend from '../components/SeatLegend'
import ReservationItem from '../components/ReservationItem'
import Proscenium from '../components/Proscenium'
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
    <main className="page page-wide">
      <h1>{canManageOthers ? 'Manage reservations' : 'My reservations'}</h1>

      {error && <p className="alert alert-error">{error}</p>}
      {feedback && (
        <p className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </p>
      )}

      <div className="layout">
        <aside className="sidebar">
          {canManageOthers && (
            <div className="panel">
              <h2 className="panel-title">Admin — viewing</h2>
              <div className="field">
                <label htmlFor="user-picker">Reservations for</label>
                <select id="user-picker" value={viewedUserId} onChange={handleUserChange}>
                  <option value={user.id}>{user.name} (you)</option>
                  {users.filter((u) => u.id !== user.id).map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="panel">
            <h2 className="panel-title">Legend</h2>
            <SeatLegend showEditing={editingId !== null} />
          </div>

          {editingId !== null && (
            <div className="panel">
              <h2 className="panel-title">Editing #{editingId}</h2>
              <p className="text-muted">
                {selectedSeatIds.size > 0 || removeSeatIds.size > 0
                  ? `+${selectedSeatIds.size} to add · −${removeSeatIds.size} to remove`
                  : 'Click a seat to remove it or click an available seat to add.'}
              </p>
            </div>
          )}
        </aside>

        <div className="main-panel">
          <SeatMap
            seats={seats}
            reservationMarkers={reservationMarkers}
            removableSeatIds={removableSeatIds}
            pendingRemoveSeatIds={removeSeatIds}
            selectedSeatIds={selectedSeatIds}
            onSeatClick={editingId !== null ? handleSeatClick : undefined}
          />
          <Proscenium />
        </div>
      </div>

      <div className="reservation-section">
        {reservations.length === 0 ? (
          <p className="text-muted">No reservations yet.</p>
        ) : (
          <>
            <p className="reservation-section-title">
              {reservations.length} reservation{reservations.length !== 1 ? 's' : ''}
            </p>
            <ul className="reservation-list">
              {reservations.map((reservation, index) => (
                <ReservationItem
                  key={reservation.id}
                  reservation={reservation}
                  index={index}
                  editingId={editingId}
                  confirmDeleteId={confirmDeleteId}
                  submitting={submitting}
                  selectedSeatIds={selectedSeatIds}
                  removeSeatIds={removeSeatIds}
                  onEdit={startEdit}
                  onCancelEdit={cancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onDeleteRequest={setConfirmDeleteId}
                  onDeleteConfirm={handleDelete}
                  onDeleteCancel={() => setConfirmDeleteId(null)}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  )
}

export default Reservations
