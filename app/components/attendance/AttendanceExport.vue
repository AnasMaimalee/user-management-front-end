<script setup lang="ts">
import { message } from 'ant-design-vue'
import { useAdminAttendanceService } from '@/composables/useAdminAttendanceService'

const { exportExcel } = useAdminAttendanceService()

const downloadExcel = async () => {
  try {
    const { data, error } = await exportExcel(
      '2025-12-01',
      '2025-12-31'
    )

    if (error.value || !data.value) {
      message.error('Export failed')
      return
    }

    // ✅ Convert response to file
    const blob = new Blob([data.value], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = 'attendance-report.xlsx'
    document.body.appendChild(link)
    link.click()

    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    message.success('Excel exported successfully')
  } catch (e) {
    console.error(e)
    message.error('Export failed')
  }
}
</script>

<template>
  <a-button @click="downloadExcel">
    Export Excel
  </a-button>
</template>
