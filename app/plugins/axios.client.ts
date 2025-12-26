// plugins/api.client.ts
import axios from 'axios'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(async () => {
  const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    withCredentials: true, // ← CRITICAL: Send cookies with every request
  })

  // Optional: Global error handling
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Redirect to login on unauthorized
        navigateTo('/login')
      }
      return Promise.reject(error)
    }
  )

  // Fetch CSRF cookie on app load (required for POST/PUT/PATCH/DELETE)
  try {
    await api.get('/sanctum/csrf-cookie')
  } catch (e) {
    console.warn('Failed to fetch CSRF cookie')
  }

  return {
    provide: {
      api,
    },
  }
})