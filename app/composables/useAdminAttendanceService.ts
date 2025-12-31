export const useAdminAttendanceService = () => {
  const today = () =>
    useFetch('/api/admin/attendance/today')

  const exportExcel = (from: string, to: string) =>
    useFetch('/api/admin/attendance/export/excel', {
      params: { from, to },
      responseType: 'blob',
      server: false, // 🔴 VERY IMPORTANT
    })

  return {
    today,
    exportExcel,
  }
}
