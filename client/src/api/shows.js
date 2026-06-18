import api from './api'

export const getShows = async () => {
  const { data } = await api.get('/shows')
  return data
}

export const getShow = async (id) => {
  const { data } = await api.get(`/shows/${id}`)
  return data
}
