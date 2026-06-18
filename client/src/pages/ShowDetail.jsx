import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faClock, faCalendarDays } from '@fortawesome/free-solid-svg-icons'
import { getShow } from '../api/shows'

const fmtMonth = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })
const fmtDay   = (d) => new Date(d + 'T00:00:00').getDate()
const fmtWday  = (d) => new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })

function ShowDetail() {
  const { showId } = useParams()
  const navigate = useNavigate()
  const [show, setShow] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getShow(showId)
      .then(setShow)
      .catch(() => setError('Show not found'))
  }, [showId])

  if (error) return (
    <div className="min-vh-100">
      <div className="show-detail-hero" style={{ '--poster': 'none' }}>
        <div className="show-detail-hero-overlay" />
        <div className="show-detail-hero-content">
          <button className="btn-back" onClick={() => navigate('/')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </button>
          <p className="alert alert-error" style={{ marginTop: 0 }}>{error}</p>
        </div>
      </div>
    </div>
  )

  if (!show) return (
    <div className="min-vh-100">
      <div className="show-detail-hero" style={{ '--poster': 'none' }}>
        <div className="show-detail-hero-overlay" />
        <div className="show-detail-hero-content">
          <p className="text-muted">Loading…</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-vh-100">
      <div
        className="show-detail-hero"
        style={{ '--poster': show.posterUrl ? `url(${JSON.stringify(show.posterUrl)})` : 'none' }}
      >
        <div className="show-detail-hero-overlay" />
        <div className="show-detail-hero-content">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <FontAwesomeIcon icon={faArrowLeft} />
            Back
          </button>
          <h1 className="show-detail-title">{show.title}</h1>
          {show.description && (
            <p className="show-detail-desc">{show.description}</p>
          )}
          <div className="show-detail-meta">
            <span className="show-detail-badge">
              <FontAwesomeIcon icon={faClock} />
              {show.duration} min
            </span>
            <span className="show-detail-badge">
              <FontAwesomeIcon icon={faCalendarDays} />
              {show.dates.length} date{show.dates.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 p-lg-5">
        <h2 className="show-detail-dates-heading d-flex align-items-center gap-2">
          <FontAwesomeIcon icon={faCalendarDays} />
          Choose a date
        </h2>
        {show.dates.length === 0 ? (
          <p className="text-muted">No upcoming dates scheduled.</p>
        ) : (
          <div className="d-flex flex-wrap gap-3">
            {show.dates.map((d, i) => (
              <button
                key={d.id}
                className="date-chip"
                style={{ '--chip-index': i }}
                onClick={() => navigate(`/shows/${show.id}/dates/${d.id}`)}
              >
                <span className="date-chip-month">{fmtMonth(d.date)}</span>
                <span className="date-chip-day">{fmtDay(d.date)}</span>
                <span className="date-chip-weekday">{fmtWday(d.date)}</span>
                <span className="date-chip-time">{d.time}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ShowDetail
