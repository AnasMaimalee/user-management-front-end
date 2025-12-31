<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAttendanceService } from '@/services/attendance.service'

const attendance = useAttendanceService()

const summary = ref<any>(null)
const history = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  const s = await attendance.getSummary()
  summary.value = s.data.value

  const h = await attendance.getHistory()
  history.value = h.data.value.data

  loading.value = false
})
</script>

<template>
  <a-spin :spinning="loading">
    <a-row gutter="16">
      <a-col :span="6">
        <AttendanceStats
          title="Present Days"
          :value="summary?.present_days"
          color="green"
        />
      </a-col>

      <a-col :span="6">
        <AttendanceStats
          title="Absent Days"
          :value="summary?.absent_days"
          color="red"
        />
      </a-col>

      <a-col :span="6">
        <AttendanceStats
          title="Attendance %"
          :value="summary?.attendance_percentage + '%'"
          color="blue"
        />
      </a-col>

      <a-col :span="6">
        <AttendanceStats
          title="Performance"
          :value="summary?.performance_score"
          color="purple"
        />
      </a-col>
    </a-row>

    <AttendanceChart />

    <AttendanceHistory :rows="history" />
  </a-spin>
</template>
