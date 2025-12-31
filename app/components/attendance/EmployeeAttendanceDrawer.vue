<!-- components/attendance/EmployeeAttendanceDrawer.vue -->
<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '~/utils/api'
import { message } from 'ant-design-vue'

const props = defineProps<{
  employee: any | null
  open: boolean
}>()

const emit = defineEmits(['close'])

const rows = ref<any[]>([])
const loading = ref(false)

// Fetch employee attendance history when drawer opens
watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen && props.employee?.id) {
      loading.value = true
      try {
        const res = await api.get(`/admin/attendance/employee/${props.employee.id}`)
        // Adjust based on your API response structure
        rows.value = Array.isArray(res.data) ? res.data : res || []
      } catch (err: any) {
        console.error('Failed to load employee attendance history:', err)
        message.error('Failed to load attendance records')
        rows.value = []
      } finally {
        loading.value = false
      }
    } else {
      rows.value = []
    }
  },
  { immediate: false }
)
</script>

<template>
  <a-drawer
    :open="open"
    width="600"
    title="Employee Attendance History"
    placement="right"
    @close="emit('close')"
  >
    <template #extra>
      <div class="text-sm text-slate-600 font-medium">
        {{ employee?.first_name }} {{ employee?.last_name }}
        <span class="text-slate-400 ml-2">
          ({{ employee?.employee_code || 'N/A' }})
        </span>
      </div>
    </template>

    <a-table
      :data-source="rows"
      :loading="loading"
      row-key="id"
      size="small"
      :pagination="{ pageSize: 10 }"
      class="mt-4"
    >
      <a-table-column title="Date" data-index="attendance_date">
        <template #default="{ text }">
          {{ text ? new Date(text).toLocaleDateString('en-GB') : '—' }}
        </template>
      </a-table-column>

      <a-table-column title="Status" data-index="status">
        <template #default="{ text }">
          <a-tag :color="text === 'present' ? 'green' : 'volcano'">
            {{ text ? text.toUpperCase() : '—' }}
          </a-tag>
        </template>
      </a-table-column>

      <a-table-column title="Clock In" data-index="clock_in">
        <template #default="{ text }">
          {{ text ? new Date(text).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' }}
        </template>
      </a-table-column>

      <a-table-column title="Clock Out" data-index="clock_out">
        <template #default="{ text }">
          {{ text ? new Date(text).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—' }}
        </template>
      </a-table-column>

      <a-table-column title="Worked" data-index="worked_minutes">
        <template #default="{ text }">
          <span class="font-medium">
            {{ text ? `${Math.floor(text / 60)}h ${text % 60}m` : '—' }}
          </span>
        </template>
      </a-table-column>

      <a-table-column title="Late" data-index="late_minutes">
        <template #default="{ text }">
          <span :class="{ 'text-red-600 font-medium': text > 0 }">
            {{ text > 0 ? `${text} mins` : '—' }}
          </span>
        </template>
      </a-table-column>
    </a-table>

    <template #footer>
      <div v-if="rows.length === 0 && !loading" class="text-center text-slate-500 py-8">
        No attendance records found for this employee
      </div>
    </template>
  </a-drawer>
</template>

<style scoped>
:deep(.ant-drawer-header) {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 16px;
}

:deep(.ant-drawer-body) {
  padding: 24px;
}
</style>