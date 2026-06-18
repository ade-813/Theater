import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faCalendarDays, faChair } from '@fortawesome/free-solid-svg-icons'
import ShowCard from '../components/ShowCard'
import { getShows } from '../api/shows'

function Browse() {
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getShows().then(setShows).finally(() => setLoading(false))
  }, [])

  const featured = shows[0]

  return (
    <div className="min-vh-100">

      {}
      {!loading && featured && (
        <section
          className="browse-hero"
          style={{
            '--hero-poster': featured.posterUrl
              ? `url(${JSON.stringify(featured.posterUrl)})`
              : 'none',
          }}
        >
          <div className="browse-hero-bg" />
          <div className="browse-hero-content">
            <p className="browse-hero-eyebrow">Featured show</p>
            <h2 className="browse-hero-title">{featured.title}</h2>
            {featured.description && (
              <p className="browse-hero-desc">{featured.description}</p>
            )}
            <div className="browse-hero-meta">
              <span>
                <FontAwesomeIcon icon={faClock} />
                {featured.duration} min
              </span>
              <span>
                <FontAwesomeIcon icon={faCalendarDays} />
                {featured.dates?.length ?? 0} date
                {featured.dates?.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              type="button"
              className="btn btn-primary browse-hero-btn"
              onClick={() => navigate(`/shows/${featured.id}`)}
            >
              <FontAwesomeIcon icon={faChair} />
              Book seats
            </button>
          </div>
        </section>
      )}

      {}
      <section className="px-4 pt-4 pb-5">
        <div className="d-flex align-items-center gap-3 mb-4">
          <span className="browse-section-line" />
          <h2 className="browse-section-title mb-0 text-nowrap">All Shows</h2>
          <span className="browse-section-line" />
        </div>

        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : shows.length === 0 ? (
          <p className="text-muted">No shows available.</p>
        ) : (
          <div className="show-grid">
            {shows.map((show, i) => (
              <ShowCard key={show.id} show={show} index={i} />
            ))}
          </div>
        )}
      </section>

    </div>
  )
}

export default Browse
