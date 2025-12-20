// ~/middleware/auth.global.ts
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore()

  // Pinia is already hydrated at this point
  if (!auth.isAuthenticated && to.path !== '/login') {
    return navigateTo('/login')
  }
})
