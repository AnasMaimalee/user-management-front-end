// composables/useAdminAttendanceService.ts
export const useAdminAttendanceService = () => {
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
    useFetch(`/api/admin/attendance/employee/${employeeId}`)

  return {
    today,
    report,
    exportExcel,
    employee,
  }
}
