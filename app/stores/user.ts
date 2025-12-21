// stores/user.ts
import { defineStore } from 'pinia'
import api from '~/utils/api'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null as any,
    permissions: [] as string[],
  }),
  actions: {
    async fetchUser() {
      const { data } = await api.get('/me')
      this.user = data.user
      this.permissions = data.permissions
      console.log(this.permissions, "Permsiions")
    },
    can(permission: string) {
      return this.permissions.includes(permission)
    }
  }
})
