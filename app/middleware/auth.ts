// middleware/auth.ts
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to, from) => {
  const auth = useAuthStore()

  // Wait for user fetch (if you have a fetchUser method)
  if (!auth.isFetched) {  // <-- you need a flag in your store
    await auth.fetchUser()
  }

  const publicPages = ['/login', '/', '/forgot-password', 'reset-password']

  if (!auth.isAuthenticated && !publicPages.includes(to.path)) {
    return navigateTo('/login')
  }

  // Optional: redirect authenticated users away from login/register
  if (auth.isAuthenticated && publicPages.includes(to.path)) {
    return navigateTo('/') // dashboard/home
  }
})
