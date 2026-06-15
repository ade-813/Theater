import api from './api'

// userId is only honored by the server for TOTP-verified admins viewing
// another user's reservations; omit it to get the current user's own
const getReservations = async (userId) => {
  const response = await api.get('/reservations', { params: userId ? { userId } : {} })
  return response.data
}

// data is either { seatIds } for direct selection or { count, category } for
// count+category assignment
const createReservation = async (data) => {
  const response = await api.post('/reservations', data)
  return response.data
}

// data is { addSeatIds, removeSeatIds }
const updateReservation = async (id, data) => {
  const response = await api.put(`/reservations/${id}`, data)
  return response.data
}

const deleteReservation = async (id) => {
  await api.delete(`/reservations/${id}`)
}

export { getReservations, createReservation, updateReservation, deleteReservation }
