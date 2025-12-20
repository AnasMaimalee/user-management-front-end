// ~/stores/auth.ts
import { defineStore } from 'pinia'

interface User {
  id: number
  name: string
  email: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: null as string | null,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
  },
  actions: {
    async login(payload: { email: string; password: string }) {
      const { $api } = useNuxtApp()
      this.loading = true
      try {
        const res = await $api.post('/login', payload)
        this.token = res.data.access_token
        this.user = res.data.user
        console.log(this.user)
        await navigateTo('/dashboard')
      } finally {
        this.loading = false
      }
    },
    logout() {
      this.token = null
      this.user = null
      navigateTo('/login')
    },
  },
  persist: true,
})
