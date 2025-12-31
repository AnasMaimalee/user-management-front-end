import { useFetch } from '#app'

export const useAttendanceService = () => {
  const getSummary = () =>
    useFetch('/api/employee/attendance/summary')

  const getHistory = (page = 1) =>
    useFetch(`/api/employee/attendance/history?page=${page}`)

  return {
    getSummary,
    getHistory,
  }
}
