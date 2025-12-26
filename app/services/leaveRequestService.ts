export const leaveRequestService = {
  // ===== Admin / HR =====
  getAll() {
    const { $api } = useNuxtApp()
    return $api.get('/leaves')
  },

  // ===== Staff =====
  getMyLeaves() {
    const { $api } = useNuxtApp()
    return $api.get('/leaves/my')
  },

  create(payload: {
    reason: string
    start_date: string
    end_date: string
    resume_date: string
  }) {
    const { $api } = useNuxtApp()
    return $api.post('/leaves', payload)
  },

  updateStatus(
    id: string,
    payload: {
      status: 'approved' | 'rejected'
      admin_note?: string
    }
  ) {
    const { $api } = useNuxtApp()
    return $api.patch(`/leaves/${id}`, payload)
  }
}
