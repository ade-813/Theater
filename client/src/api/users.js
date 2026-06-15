import api from './api'

// admin-only: list of all users, to pick whose reservations to manage
const getUsers = async () => {
  const response = await api.get('/users')
  return response.data
}

export { getUsers }
