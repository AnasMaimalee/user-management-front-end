import { defineStore } from 'pinia'
import api from '~/utils/api'

interface User {
  id: string
  name: string
  email: string
  roles?: string[]
  permissions?: string[]
  menus?: any[]
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
    async fetchUser() {
      try {
        const res = await api.get('/me')
              this.user = {
        ...res.data.user,
        roles: res.data.roles, // ← array of roles
        permissions: res.data.permissions,
        menus: res.data.menus,
      }
      } catch (err) {
        console.error('Auth expired')
        this.logout()
      }
    },

    async login(payload: { email: string; password: string }) {
      this.loading = true
      try {
        const res = await api.post('/login', payload)

        // IMPORTANT: token first
        this.token = res.data.access_token

        // then fetch user (token now exists)
        await this.fetchUser()

        await navigateTo('/dashboard')
      } finally {
        this.loading = false
      }
    },

    async register(payload: {
      name: string
      email: string
      password: string
      password_confirmation: string
    }) {
      this.loading = true
      try {
        const res = await api.post('/register', payload)

        this.token = res.data.access_token
        await this.fetchUser()

        await navigateTo('/dashboard')
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      this.token = null
      navigateTo('/login')
    },
  },

  persist: true,
})
