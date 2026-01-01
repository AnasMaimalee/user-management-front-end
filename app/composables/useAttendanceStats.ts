import { ref } from 'vue'
import api from '~/utils/api'

export const useAttendanceStats = () => {
  const stats = ref<any>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchStats = async () => {
    loading.value = true
    error.value = null

    try {
      const res = await api.get('/attendance/stats')
      stats.value = res.data.data
    } catch (e: any) {
      error.value = e?.response?.data?.message || 'Failed to load stats'
    } finally {
      loading.value = false
    }
  }

  return {
    stats,
    loading,
    error,
    fetchStats
  }
}
