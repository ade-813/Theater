import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { getHealth } from '../api/api'

function Home() {
  const [apiStatus, setApiStatus] = useState('checking...')

  useEffect(() => {
    getHealth()
      .then(() => setApiStatus('ok'))
      .catch(() => setApiStatus('unreachable'))
  }, [])

  return (
    <>
      <Navbar />
      <main>
        <h1>Theater seat map</h1>
        <p>API status: {apiStatus}</p>
        {/* TODO: render seat map from GET /api/seats */}
      </main>
    </>
  )
}

export default Home
