import api from './api'

export const getAdminShows = async () => {
  const { data } = await api.get('/admin/shows')
  return data
}

export const createShow = async (show) => {
  const { data } = await api.post('/admin/shows', show)
  return data
}

export const deleteShow = async (id) => {
  await api.delete(`/admin/shows/${id}`)
}

export const createShowDate = async (showId, { date, time }) => {
  const { data } = await api.post(`/admin/shows/${showId}/dates`, { date, time })
  return data
}

export const deleteShowDate = async (showId, dateId) => {
  await api.delete(`/admin/shows/${showId}/dates/${dateId}`)
}

export const getAdminReservations = async (showDateId) => {
  const { data } = await api.get('/admin/reservations', {
    params: showDateId ? { showDateId } : {}
  })
  return data
}

export const deleteAdminReservation = async (id) => {
  await api.delete(`/admin/reservations/${id}`)
}
