import api from './api'

const getSeats = async () => {
  const response = await api.get('/seats')
  return response.data
}

export { getSeats }
