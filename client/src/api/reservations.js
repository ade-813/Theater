import api from './api'

const getReservations = async () => {
  const response = await api.get('/reservations')
  return response.data
}

export { getReservations }
