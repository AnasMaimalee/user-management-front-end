// services/admin-attendance.service.ts

import { useCookie } from '#app'

export const useAdminAttendanceService = () => {
  const authToken = useCookie('auth_token')

  // Build headers only if token exists
  const headers = authToken.value
    ? { Authorization: `Bearer ${authToken.value}` }
    : {}

  const today = () =>
    useFetch('/api/admin/attendance/today', {
      headers,
      // Optional: if SSR and still 401, add cookie proxy
      // ...(process.server && { headers: { cookie: useRequestHeaders(['cookie']).cookie } }),
    })

  const exportExcel = (from: string, to: string) =>
    useFetch('/api/admin/attendance/export/excel', {
      headers,
      params: { from, to },
      responseType: 'blob' as const, // 'as const' fixes type narrowing
      server: false, // OK to keep, disables SSR for this call (good for blobs)
    })

  return { today, exportExcel }
}