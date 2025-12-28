// ~/utils/api.ts
import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

const api = axios.create({
  baseURL: 'http://172.24.24.69:8000/api',
  withCredentials: false, // Bearer token auth
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()

  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }

  return config
})

export default api
