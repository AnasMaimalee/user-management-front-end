// ~/utils/api.ts
import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',  // or http://localhost:8000/api
  withCredentials: false,  // Keep this false — we use Bearer token
})

api.interceptors.request.use((config) => {
  const auth = useAuthStore()

  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }

  return config
})

export default api