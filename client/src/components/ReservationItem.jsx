import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'

const MARKER_COUNT = 5

function ReservationItem({
  reservation,
  index,
  editingId,
  confirmDeleteId,
  submitting,
  selectedSeatIds,
  removeSeatIds,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}) {
  const isEditing = editingId === reservation.id
  const isConfirming = confirmDeleteId === reservation.id
  const date = new Date(reservation.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  return (
    <li
      className="reservation-item"
      style={{ borderLeftColor: `var(--color-marker-${index % MARKER_COUNT})` }}
    >
      <div className="reservation-item-header">
        <span
          className={`reservation-marker seat-marker-${index % MARKER_COUNT}`}
          aria-hidden="true"
        />
        <span className="reservation-item-number">#{reservation.id}</span>
        <span className="reservation-item-meta">
          {reservation.seats.length} seat{reservation.seats.length !== 1 ? 's' : ''}
          {'  ·  '}
          {date}
        </span>
      </div>

      <div className="seat-chips">
        {reservation.seats.map((seat) => (
          <span key={seat.id} className="seat-chip">
            {seat.row}{seat.number}
          </span>
        ))}
      </div>

      {isEditing ? (
        <>
          {(selectedSeatIds.size > 0 || removeSeatIds.size > 0) && (
            <p className="edit-hint">
              +{selectedSeatIds.size} to add · −{removeSeatIds.size} to remove
            </p>
          )}
          <div className="btn-row">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onSaveEdit}
              disabled={submitting}
            >
              <FontAwesomeIcon icon={faCheck} /> Save changes
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={onCancelEdit}
              disabled={submitting}
            >
              <FontAwesomeIcon icon={faXmark} /> Cancel
            </button>
          </div>
        </>
      ) : (
        <div className="btn-row">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => onEdit(reservation.id)}
            disabled={editingId !== null || confirmDeleteId !== null}
          >
            <FontAwesomeIcon icon={faPen} /> Edit
          </button>
          {isConfirming ? (
            <>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => onDeleteConfirm(reservation.id)}
                disabled={submitting}
              >
                <FontAwesomeIcon icon={faTrash} /> Confirm delete
              </button>
              <button
                type="button"
                className="btn btn-sm"
                onClick={onDeleteCancel}
                disabled={submitting}
              >
                <FontAwesomeIcon icon={faXmark} /> Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => onDeleteRequest(reservation.id)}
              disabled={editingId !== null}
            >
              <FontAwesomeIcon icon={faTrash} /> Delete
            </button>
          )}
        </div>
      )}
    </li>
  )
}

export default ReservationItem
