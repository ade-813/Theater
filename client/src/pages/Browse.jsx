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
    getShows()
      .then(setShows)
      .finally(() => setLoading(false))
  }, [])

  const featured = shows[0]

  return (
    <div className="page-browse">
      {!loading && featured && (
        <section
          className="browse-hero"
          style={{ '--hero-poster': featured.posterUrl ? `url(${JSON.stringify(featured.posterUrl)})` : 'none' }}
        >
          <div className="browse-hero-bg" />
          <div className="browse-hero-content">
            <p className="browse-hero-eyebrow">Featured show</p>
            <h1 className="browse-hero-title">{featured.title}</h1>
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
                {featured.dates?.length ?? 0} upcoming date{featured.dates?.length !== 1 ? 's' : ''}
              </span>
            </div>
            <button
              className="btn btn-primary browse-hero-btn"
              onClick={() => navigate(`/shows/${featured.id}`)}
            >
              <FontAwesomeIcon icon={faChair} />
              Book seats
            </button>
          </div>
        </section>
      )}

      <section className="browse-section">
        <h2 className="browse-section-title">All shows</h2>
        {loading ? (
          <p className="text-muted">Loading…</p>
        ) : shows.length === 0 ? (
          <p className="text-muted">No shows available.</p>
        ) : (
          <div className="show-grid">
            {shows.map((show) => (
              <ShowCard key={show.id} show={show} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Browse
