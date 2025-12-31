// composables/api.ts
import { ofetch } from 'ofetch'

export const api = $fetch.create({
  baseURL: 'http://172.24.24.69:8000/api', // your PC IP + Laravel port
  credentials: 'include', // for Sanctum
  headers: {
    'Accept': 'application/json',
  },
})