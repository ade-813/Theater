import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faClock, faCalendarDays } from '@fortawesome/free-solid-svg-icons'

function ShowCard({ show }) {
  const navigate = useNavigate()
  const dateCount = show.dates?.length ?? 0

  const handleClick = () => navigate(`/shows/${show.id}`)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      navigate(`/shows/${show.id}`)
    }
  }

  return (
    <article
      className="show-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
    >
      <div className="show-card-poster">
        {show.posterUrl ? (
          <img src={show.posterUrl} alt={show.title} loading="lazy" />
        ) : (
          <div className="show-card-poster-fallback">
            <span>{show.title[0]}</span>
          </div>
        )}
        <div className="show-card-poster-overlay">
          <span className="show-card-cta">Book seats</span>
        </div>
      </div>
      <div className="show-card-info">
        <h3 className="show-card-title">{show.title}</h3>
        <div className="show-card-meta">
          <span>
            <FontAwesomeIcon icon={faClock} />
            {show.duration} min
          </span>
          <span>
            <FontAwesomeIcon icon={faCalendarDays} />
            {dateCount} date{dateCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </article>
  )
}

export default ShowCard
