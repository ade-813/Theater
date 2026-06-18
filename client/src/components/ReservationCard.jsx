import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarDays, faChair,
  faPen, faTrash, faCheck, faXmark
} from '@fortawesome/free-solid-svg-icons'

const MARKER_COUNT = 5

const fmt = (dateStr) =>
  new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })

function ReservationCard({
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
  const markerIdx = index % MARKER_COUNT

  return (
    <li
      className={`reservation-card${isEditing ? ' is-editing' : ''}`}
      style={{ '--card-color': `var(--color-marker-${markerIdx})` }}
    >
      <div className="reservation-card-strip" />
      <div className="reservation-card-body">
        <div className="reservation-card-header">
          <div>
            <h3 className="reservation-card-show">{reservation.showTitle}</h3>
            <p className="reservation-card-date">
              <FontAwesomeIcon icon={faCalendarDays} />
              {fmt(reservation.date)} · {reservation.time}–{reservation.endTime}
            </p>
          </div>

          <div className="reservation-card-actions">
            {isConfirming ? (
              <>
                <span className="reservation-card-confirm-label">Delete?</span>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => onDeleteConfirm(reservation.id)}
                  disabled={submitting}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={onDeleteCancel}
                  disabled={submitting}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </>
            ) : isEditing ? (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={onSaveEdit}
                  disabled={submitting}
                >
                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                  {selectedSeatIds.size + removeSeatIds.size > 0
                    ? `Save (${selectedSeatIds.size > 0 ? `+${selectedSeatIds.size}` : ''}${removeSeatIds.size > 0 ? ` −${removeSeatIds.size}` : ''})`
                    : 'Done'}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={onCancelEdit}
                  disabled={submitting}
                >
                  <FontAwesomeIcon icon={faXmark} />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => onEdit(reservation.id)}
                  disabled={editingId !== null || confirmDeleteId !== null}
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => onDeleteRequest(reservation.id)}
                  disabled={editingId !== null}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="reservation-card-seats">
          <FontAwesomeIcon icon={faChair} />
          {reservation.seats.map((s) => (
            <span
              key={s.id}
              className={`seat-tag${removeSeatIds.has(s.id) ? ' seat-tag-removing' : ''}`}
            >
              {s.row}{s.number}
            </span>
          ))}
          {isEditing && selectedSeatIds.size > 0 && (
            <span className="seat-tag seat-tag-adding">+{selectedSeatIds.size} to add</span>
          )}
        </div>

        {isEditing && (
          <p className="reservation-card-hint">
            Click a reserved seat to mark for removal · click an available seat to add
          </p>
        )}
      </div>
    </li>
  )
}

export default ReservationCard
