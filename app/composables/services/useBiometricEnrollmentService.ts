export function useBiometricEnrollmentService() {
  const enroll = async (employeeId: string) => {
    // Call your API to enroll biometric for the employee
    try {
      await $fetch(`/api/admin/attendance/enroll/${employeeId}`, { method: 'POST' })
      console.log(`Enroll biometric for employee ${employeeId}`);
    } catch (error) {
      console.error(error);
    }
  };

  return { enroll };
}
