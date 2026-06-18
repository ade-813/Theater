import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMasksTheater } from '@fortawesome/free-solid-svg-icons'

const PARTICLE_COUNT = 14

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-vh-100">
      <section className="landing-stage" aria-label="Theater Box Office">

        <div className="landing-curtain landing-curtain-left"  aria-hidden="true" />
        <div className="landing-curtain landing-curtain-right" aria-hidden="true" />

        <div className="landing-spotlight" aria-hidden="true" />

        <div className="landing-particles" aria-hidden="true">
          {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
            <span key={i} className={`particle particle-${i}`} />
          ))}
        </div>

        <div className="landing-floor" aria-hidden="true" />

        <div className="landing-content">
          <p className="landing-eyebrow">Est. 2025 · Box Office</p>

          <div className="landing-ornament" aria-hidden="true">
            <span className="landing-ornament-line" />
            <span className="landing-ornament-gem">◆</span>
            <span className="landing-ornament-line" />
          </div>

          <h1 className="landing-title">
            <span className="landing-title-main">Theater</span>
            <span className="landing-title-accent">Box Office</span>
          </h1>

          <div className="landing-rule" aria-hidden="true">◇ &nbsp; ◇ &nbsp; ◇</div>

          <p className="landing-subtitle">
            &ldquo;All the world&rsquo;s a stage, and all the men and women merely players.&rdquo;
          </p>

          <button
            type="button"
            className="landing-cta"
            onClick={() => navigate('/shows')}
          >
            <FontAwesomeIcon icon={faMasksTheater} />
            Explore Shows
          </button>
        </div>

      </section>
    </div>
  )
}

export default LandingPage
