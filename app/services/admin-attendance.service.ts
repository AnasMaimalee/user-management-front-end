// composables/useAdminAttendanceService.ts
export const useAdminAttendanceService = () => {

  const getHeaders = () => {
    const headers: Record<string, string> = {}
    if (authToken.value) {
      headers.Authorization = `Bearer ${authToken.value}`
    }
    // Proxy cookie on SSR (critical for initial load)
    if (process.server) {
      const cookieHeader = useRequestHeaders(['cookie']).cookie
      if (cookieHeader) headers.cookie = cookieHeader
    }
    return headers
  }

  const today = () =>
    useFetch('/api/admin/attendance/today')

  const report = (from: string, to: string) =>
    useFetch('/api/admin/attendance/report', {
      params: { from, to },
    })

  const exportExcel = (from: string, to: string) =>
    useFetch('/api/admin/attendance/export/excel', {
      params: { from, to },
      responseType: 'blob',
    })

  const employee = (employeeId: string) =>
    useFetch(`/api/admin/attendance/employee/${employeeId}` , { headers: getHeaders() })

  return {
    today,
    report,
    exportExcel,
    employee,
  }
}
