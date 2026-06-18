import api from './api'

const getSeats = async (showDateId) => {
  const { data } = await api.get('/seats', {params: showDateId ? { showDateId } : {}})
  return data
}

export { getSeats }
