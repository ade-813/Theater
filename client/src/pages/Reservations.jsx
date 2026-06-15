import Navbar from '../components/Navbar'

function Reservations() {
  return (
    <>
      <Navbar />
      <main className="page">
        <h1>My reservations</h1>
        {/* TODO: list reservations from GET /api/reservations */}
        {/* TODO: edit seats via PUT /api/reservations/:id, delete via DELETE /api/reservations/:id */}
      </main>
    </>
  )
}

export default Reservations
