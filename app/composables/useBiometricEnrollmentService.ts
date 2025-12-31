import { useFetch } from '#app'

export const useBiometricEnrollmentService = () => {
  const enroll = (employeeId: string) =>
    useFetch(`/api/admin/attendance/enroll/${employeeId}`, {
      method: 'POST',
    })

  return {
    enroll,
  }
}
