import api from './api'

const login = async (username, password) => {
  const response = await api.post('/sessions', { username, password })
  return response.data
}

const logout = async () => {
  await api.delete('/sessions/current')
}

const getCurrentUser = async () => {
  const response = await api.get('/sessions/current')
  return response.data
}

const verifyTotp = async (code) => {
  const response = await api.post('/sessions/totp', { code })
  return response.data
}

export { login, logout, getCurrentUser, verifyTotp }
