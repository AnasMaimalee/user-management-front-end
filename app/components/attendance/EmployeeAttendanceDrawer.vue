<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAdminAttendanceService } from '@/services/admin-attendance.service'

const props = defineProps<{
  employee: any
  open: boolean
}>()

const emit = defineEmits(['close'])
const service = useAdminAttendanceService()
const rows = ref<any[]>([])

watch(() => props.open, async (v) => {
  if (v && props.employee) {
    const res = await service.employee(props.employee.id)
    rows.value = res.data.value
  }
})
</script>

<template>
  <a-drawer
    :open="open"
    width="600"
    @close="emit('close')"
    title="Employee Attendance"
  >
    <a-table
      :data-source="rows"
      row-key="id"
      size="small"
    >
      <a-table-column title="Date" dataIndex="attendance_date" />
      <a-table-column title="Status" dataIndex="status" />
      <a-table-column title="Worked" dataIndex="worked_minutes" />
      <a-table-column title="Late" dataIndex="late_minutes" />
    </a-table>
  </a-drawer>
</template>
