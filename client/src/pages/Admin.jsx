import { useEffect, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFilm, faCalendarDays, faPlus, faTrash, faChevronRight,
  faClipboardList, faXmark, faClock, faCheck
} from '@fortawesome/free-solid-svg-icons'
import Toast from '../components/Toast'
import {
  getAdminShows, createShow, deleteShow,
  createShowDate, deleteShowDate,
  getAdminReservations, deleteAdminReservation
} from '../api/admin'

const fmtDate = (d) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  })

function Admin() {
  const [tab, setTab] = useState('shows')
  const [shows, setShows] = useState([])
  const [reservations, setReservations] = useState([])
  const [filterDateId, setFilterDateId] = useState('')
  const [toast, setToast] = useState(null)
  const [expandedShowId, setExpandedShowId] = useState(null)
  const [showingNewShowForm, setShowingNewShowForm] = useState(false)
  const [addingDateForShow, setAddingDateForShow] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [confirmDeleteShowId, setConfirmDeleteShowId] = useState(null)
  const [confirmDeleteDate, setConfirmDeleteDate] = useState(null) // { showId, dateId }
  const [confirmDeleteResId, setConfirmDeleteResId] = useState(null)

  const [nsTitle, setNsTitle] = useState('')
  const [nsDuration, setNsDuration] = useState('120')
  const [nsDesc, setNsDesc] = useState('')
  const [nsPoster, setNsPoster] = useState('')

  const [ndDate, setNdDate] = useState('')
  const [ndTime, setNdTime] = useState('')

  const showToast = (type, text) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 4500)
  }

  const loadShows = () =>
    getAdminShows().then(setShows).catch(() => showToast('error', 'Failed to load shows'))

  const loadReservations = (dateId) =>
    getAdminReservations(dateId || undefined)
      .then(setReservations)
      .catch(() => showToast('error', 'Failed to load reservations'))

  useEffect(() => { loadShows() }, [])

  useEffect(() => {
    if (tab === 'reservations') loadReservations(filterDateId)
  }, [tab, filterDateId])

  const handleCreateShow = (e) => {
    e.preventDefault()
    const dur = Number(nsDuration)
    if (!nsTitle.trim()) { showToast('error', 'Title is required'); return }
    if (!Number.isInteger(dur) || dur <= 0) { showToast('error', 'Duration must be a positive integer'); return }
    setSubmitting(true)
    createShow({ title: nsTitle.trim(), duration: dur, description: nsDesc || undefined, posterUrl: nsPoster || undefined })
      .then(() => {
        showToast('success', `Show "${nsTitle}" created`)
        setNsTitle(''); setNsDuration('120'); setNsDesc(''); setNsPoster('')
        setShowingNewShowForm(false)
        loadShows()
      })
      .catch((err) => showToast('error', err.response?.data?.error || 'Failed to create show'))
      .finally(() => setSubmitting(false))
  }

  const handleDeleteShow = (showId, title) => {
    setConfirmDeleteShowId(null)
    setSubmitting(true)
    deleteShow(showId)
      .then(() => { showToast('success', `"${title}" deleted`); loadShows() })
      .catch((err) => showToast('error', err.response?.data?.error || 'Failed to delete show'))
      .finally(() => setSubmitting(false))
  }

  const handleAddDate = (e, showId) => {
    e.preventDefault()
    if (!ndDate || !ndTime) { showToast('error', 'Date and time are required'); return }
    setSubmitting(true)
    createShowDate(showId, { date: ndDate, time: ndTime })
      .then(() => {
        showToast('success', 'Date added')
        setNdDate(''); setNdTime('')
        setAddingDateForShow(null)
        loadShows()
      })
      .catch((err) => showToast('error', err.response?.data?.error || 'Failed to add date'))
      .finally(() => setSubmitting(false))
  }

  const handleDeleteDate = (showId, dateId) => {
    setConfirmDeleteDate(null)
    setSubmitting(true)
    deleteShowDate(showId, dateId)
      .then(() => { showToast('success', 'Date removed'); loadShows() })
      .catch((err) => showToast('error', err.response?.data?.error || 'Failed to delete date'))
      .finally(() => setSubmitting(false))
  }

  const handleDeleteReservation = (id) => {
    setConfirmDeleteResId(null)
    setSubmitting(true)
    deleteAdminReservation(id)
      .then(() => { showToast('success', 'Reservation deleted'); loadReservations(filterDateId) })
      .catch((err) => showToast('error', err.response?.data?.error || 'Failed to delete'))
      .finally(() => setSubmitting(false))
  }

  const allDates = shows.flatMap((s) =>
    s.dates.map((d) => ({ ...d, showTitle: s.title }))
  )

  return (
    <main className="page-admin">
      {toast && <Toast toast={toast} onDismiss={() => setToast(null)} />}

      <h1>Admin</h1>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link${tab === 'shows' ? ' active' : ''}`}
            onClick={() => setTab('shows')}
          >
            <FontAwesomeIcon icon={faFilm} className="me-2" />
            Shows
          </button>
        </li>
        <li className="nav-item">
          <button
            type="button"
            className={`nav-link${tab === 'reservations' ? ' active' : ''}`}
            onClick={() => setTab('reservations')}
          >
            <FontAwesomeIcon icon={faClipboardList} className="me-2" />
            Reservations
          </button>
        </li>
      </ul>

      {tab === 'shows' && (
        <>
          <div className="d-flex align-items-center justify-content-between mb-3">
            <span className="text-muted" style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {shows.length} show{shows.length !== 1 ? 's' : ''}
            </span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowingNewShowForm((v) => !v)}
            >
              <FontAwesomeIcon icon={showingNewShowForm ? faXmark : faPlus} className="me-1" />
              {showingNewShowForm ? 'Cancel' : 'New show'}
            </button>
          </div>

          {showingNewShowForm && (
            <div className="card mb-4">
              <div className="card-body">
                <h6 className="panel-label">New show</h6>
                <form onSubmit={handleCreateShow}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label htmlFor="ns-title" className="form-label">Title</label>
                      <input id="ns-title" type="text" className="form-control" value={nsTitle} onChange={(e) => setNsTitle(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="ns-duration" className="form-label">Duration (min)</label>
                      <input id="ns-duration" type="number" min="1" className="form-control" value={nsDuration} onChange={(e) => setNsDuration(e.target.value)} required />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="ns-poster" className="form-label">
                        Poster URL <span className="text-muted">(optional)</span>
                      </label>
                      <input id="ns-poster" type="url" className="form-control" value={nsPoster} onChange={(e) => setNsPoster(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <label htmlFor="ns-desc" className="form-label">
                        Description <span className="text-muted">(optional)</span>
                      </label>
                      <input id="ns-desc" type="text" className="form-control" value={nsDesc} onChange={(e) => setNsDesc(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                        <FontAwesomeIcon icon={faPlus} className="me-1" /> Create show
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="admin-show-list">
            {shows.map((show) => {
              const isExpanded = expandedShowId === show.id
              const isAddingDate = addingDateForShow === show.id
              return (
                <div
                  key={show.id}
                  className={`card admin-show-item mb-2${isExpanded ? ' is-expanded' : ''}`}
                >
                  <div
                    className="card-header admin-show-header d-flex align-items-center gap-3"
                    onClick={() => setExpandedShowId(isExpanded ? null : show.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setExpandedShowId(isExpanded ? null : show.id) }}
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="admin-show-expand" />
                    <span className="admin-show-title">{show.title}</span>
                    <span className="admin-show-meta">
                      <span><FontAwesomeIcon icon={faClock} className="me-1" />{show.duration} min</span>
                      <span><FontAwesomeIcon icon={faCalendarDays} className="me-1" />{show.dates.length} date{show.dates.length !== 1 ? 's' : ''}</span>
                    </span>

                    <div className="ms-auto d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {confirmDeleteShowId === show.id ? (
                        <>
                          <span className="small text-danger fw-semibold">Delete?</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteShow(show.id, show.title)}
                            disabled={submitting}
                          >
                            <FontAwesomeIcon icon={faCheck} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setConfirmDeleteShowId(null)}
                            disabled={submitting}
                          >
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => setConfirmDeleteShowId(show.id)}
                          disabled={submitting}
                          title="Delete show"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="card-body admin-show-body">
                    <p className="panel-label">Scheduled dates</p>

                    {show.dates.length === 0 ? (
                      <p className="text-muted small mb-3">No dates yet.</p>
                    ) : (
                      <div className="d-flex flex-column gap-2 mb-3">
                        {show.dates.map((d) => (
                          <div key={d.id} className="d-flex align-items-center gap-3 px-3 py-2 rounded border">
                            <span className="fw-medium small">{fmtDate(d.date)}</span>
                            <span className="text-muted small">{d.time}–{d.endTime}</span>

                            <div className="ms-auto d-flex align-items-center gap-2">
                              {confirmDeleteDate?.dateId === d.id ? (
                                <>
                                  <span className="small text-danger fw-semibold">Delete?</span>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDeleteDate(show.id, d.id)}
                                    disabled={submitting}
                                  >
                                    <FontAwesomeIcon icon={faCheck} />
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => setConfirmDeleteDate(null)}
                                    disabled={submitting}
                                  >
                                    <FontAwesomeIcon icon={faXmark} />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setConfirmDeleteDate({ showId: show.id, dateId: d.id })}
                                  disabled={submitting}
                                >
                                  <FontAwesomeIcon icon={faTrash} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isAddingDate ? (
                      <form className="admin-date-form" onSubmit={(e) => handleAddDate(e, show.id)}>
                        <div className="mb-3">
                          <label className="form-label">Date</label>
                          <input type="date" className="form-control form-control-sm" value={ndDate} onChange={(e) => setNdDate(e.target.value)} required />
                        </div>
                        <div className="mb-3">
                          <label className="form-label">Time</label>
                          <input type="time" className="form-control form-control-sm" value={ndTime} onChange={(e) => setNdTime(e.target.value)} required />
                        </div>
                        <div className="d-flex gap-2 align-items-end" style={{ marginBottom: 0 }}>
                          <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                            <FontAwesomeIcon icon={faPlus} className="me-1" /> Add
                          </button>
                          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setAddingDateForShow(null)}>
                            <FontAwesomeIcon icon={faXmark} />
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setAddingDateForShow(show.id)}
                      >
                        <FontAwesomeIcon icon={faPlus} className="me-1" /> Add date
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {tab === 'reservations' && (
        <>
          <div className="d-flex align-items-center gap-3 mb-4">
            <label htmlFor="filter-date" className="form-label mb-0 text-nowrap">
              Filter by show date
            </label>
            <select
              id="filter-date"
              className="form-select"
              value={filterDateId}
              onChange={(e) => setFilterDateId(e.target.value)}
              style={{ maxWidth: 320 }}
            >
              <option value="">All dates</option>
              {allDates.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.showTitle} · {fmtDate(d.date)} {d.time}
                </option>
              ))}
            </select>
          </div>

          {reservations.length === 0 ? (
            <p className="text-muted">No reservations found.</p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {reservations.map((r) => (
                <div key={r.id} className="card">
                  <div className="card-body d-flex align-items-center gap-3 py-2 px-3">
                    <span className="fw-semibold small" style={{ minWidth: 100 }}>{r.name}</span>
                    <span className="text-muted small flex-grow-1">{r.showTitle} · {fmtDate(r.date)} {r.time}</span>
                    <div className="admin-res-seats">
                      {r.seats.map((s) => (
                        <span key={s.id} className="seat-tag">{s.row}{s.number}</span>
                      ))}
                    </div>

                    {confirmDeleteResId === r.id ? (
                      <>
                        <span className="small text-danger fw-semibold">Delete?</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDeleteReservation(r.id)}
                          disabled={submitting}
                        >
                          <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => setConfirmDeleteResId(null)}
                          disabled={submitting}
                        >
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => setConfirmDeleteResId(r.id)}
                        disabled={submitting}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}

export default Admin
