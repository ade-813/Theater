import api from './api'

const getReservations = async () => {
  const response = await api.get('/reservations')
  return response.data
}

// data is either { seatIds } for direct selection or { count, category } for
// count+category assignment
const createReservation = async (data) => {
  const response = await api.post('/reservations', data)
  return response.data
}

export { getReservations, createReservation }
