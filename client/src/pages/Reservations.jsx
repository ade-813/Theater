import { useContext, useEffect, useMemo, useState } from 'react'
import SeatMap from '../components/SeatMap'
import SeatLegend from '../components/SeatLegend'
import ReservationCard from '../components/ReservationCard'
import Proscenium from '../components/Proscenium'
import Toast from '../components/Toast'
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
  const [toast, setToast] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [selectedSeatIds, setSelectedSeatIds] = useState(new Set())
  const [removeSeatIds, setRemoveSeatIds] = useState(new Set())
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const canManageOthers = user.isAdmin && user.isTotpVerified

  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    getSeats().then(setSeats).catch(() => {})
  }, [])

  useEffect(() => {
    if (!canManageOthers) return
    getUsers().then(setUsers).catch(() => {})
  }, [canManageOthers])

  useEffect(() => {
    getReservations(viewedUserId === user.id ? undefined : viewedUserId)
      .then(setReservations)
      .catch(() => setReservations([]))
  }, [viewedUserId, user.id])

  const refresh = () => {
    getSeats().then(setSeats).catch(() => {})
    getReservations(viewedUserId === user.id ? undefined : viewedUserId)
      .then(setReservations)
      .catch(() => setReservations([]))
  }

  const reservationMarkers = useMemo(() => {
    const markers = new Map()
    reservations.forEach((r, i) => {
      for (const seat of r.seats) markers.set(seat.id, i % MARKER_COUNT)
    })
    return markers
  }, [reservations])

  const removableSeatIds = useMemo(() => {
    const ids = new Set()
    const r = reservations.find((r) => r.id === editingId)
    if (r) for (const seat of r.seats) ids.add(seat.id)
    return ids
  }, [editingId, reservations])

  const handleSeatClick = (seat) => {
    if (removableSeatIds.has(seat.id))
      setRemoveSeatIds((cur) => toggleId(cur, seat.id))
    else if (seat.status === 'available' || !seat.status)
      setSelectedSeatIds((cur) => toggleId(cur, seat.id))
  }

  const startEdit = (id) => {
    setEditingId(id)
    setSelectedSeatIds(new Set())
    setRemoveSeatIds(new Set())
    setConfirmDeleteId(null)
    setToast(null)
    const r = reservations.find((r) => r.id === id)
    if (r) getSeats(r.showDateId).then(setSeats).catch(() => {})
  }

  const cancelEdit = () => {
    setEditingId(null)
    setSelectedSeatIds(new Set())
    setRemoveSeatIds(new Set())
  }

  const handleSaveEdit = () => {
    if (selectedSeatIds.size === 0 && removeSeatIds.size === 0) { cancelEdit(); return }
    setSubmitting(true)
    updateReservation(editingId, {
      addSeatIds: [...selectedSeatIds],
      removeSeatIds: [...removeSeatIds],
    })
      .then(() => {
        showToast('success', 'Reservation updated')
        cancelEdit()
        refresh()
      })
      .catch((err) =>
        showToast('error', err.response?.data?.error || 'Unable to update reservation')
      )
      .finally(() => setSubmitting(false))
  }

  const handleDelete = (id) => {
    setSubmitting(true)
    deleteReservation(id)
      .then(() => {
        showToast('success', 'Reservation deleted')
        setConfirmDeleteId(null)
        if (editingId === id) cancelEdit()
        refresh()
      })
      .catch((err) =>
        showToast('error', err.response?.data?.error || 'Unable to delete reservation')
      )
      .finally(() => setSubmitting(false))
  }

  const handleUserChange = (e) => {
    setViewedUserId(Number(e.target.value))
    cancelEdit()
    setConfirmDeleteId(null)
    setToast(null)
  }

  return (
    <main className="page-wide">
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      <h1>{canManageOthers ? 'Manage reservations' : 'My reservations'}</h1>

      {canManageOthers && (
        <div className="card mb-4" style={{ maxWidth: 340 }}>
          <div className="card-body py-3">
            <p className="panel-label">Viewing</p>
            <select
              id="user-picker"
              className="form-select form-select-sm"
              value={viewedUserId}
              onChange={handleUserChange}
            >
              <option value={user.id}>{user.name} (you)</option>
              {users.filter((u) => u.id !== user.id).map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {editingId !== null && (
        <div className="row g-3 align-items-start mb-2">
          <aside className="col-12 col-md-4 col-lg-3 d-flex flex-column gap-3">
            <div className="card">
              <div className="card-body">
                <p className="panel-label">Legend</p>
                <SeatLegend showEditing />
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <p className="panel-label">Edit mode</p>
                <p className="text-muted small mb-0">
                  {selectedSeatIds.size > 0 || removeSeatIds.size > 0
                    ? `+${selectedSeatIds.size} to add · −${removeSeatIds.size} to remove`
                    : 'Click reserved seats to remove, available to add.'}
                </p>
              </div>
            </div>
          </aside>

          <div className="col-12 col-md-8 col-lg-9">
            <div className="card">
              <div className="card-body">
                <SeatMap
                  seats={seats}
                  reservationMarkers={reservationMarkers}
                  removableSeatIds={removableSeatIds}
                  pendingRemoveSeatIds={removeSeatIds}
                  selectedSeatIds={selectedSeatIds}
                  onSeatClick={handleSeatClick}
                />
                <Proscenium />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="reservation-section">
        {reservations.length === 0 ? (
          <p className="text-muted">No reservations yet.</p>
        ) : (
          <>
            <p className="reservation-section-title">
              {reservations.length} reservation{reservations.length !== 1 ? 's' : ''}
            </p>
            <ul className="reservation-cards">
              {reservations.map((r, i) => (
                <ReservationCard
                  key={r.id}
                  reservation={r}
                  index={i}
                  editingId={editingId}
                  confirmDeleteId={confirmDeleteId}
                  submitting={submitting}
                  selectedSeatIds={editingId === r.id ? selectedSeatIds : new Set()}
                  removeSeatIds={editingId === r.id ? removeSeatIds : new Set()}
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
