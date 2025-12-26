import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuthStore()

  const publicPaths = [
    '/',
    '/login',
    '/forgot-password',
    '/reset-password',
  ]

  // Get path without trailing slash
  const cleanPath = to.path.replace(/\/$/, '')

  // Check if path is exactly public or starts with public
  const isPublic = publicPaths.some(p => cleanPath === p || cleanPath.startsWith(p + '/'))

  if (!auth.isAuthenticated && !isPublic) {
    return navigateTo('/login')
  }
})
