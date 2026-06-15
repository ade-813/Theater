import axios from 'axios'

const baseURL = 'http://localhost:3001/api'

const api = axios.create({
  baseURL,
  withCredentials: true
})

const getHealth = async () => {
  const response = await api.get('/health')
  return response.data
}

export { getHealth }
export default api
