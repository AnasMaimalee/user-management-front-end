<!-- components/attendance/TodayAttendanceTable.vue -->
<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">Today's Attendance</h1>
    </div>

    <a-alert
      v-if="error"
      type="error"
      :message="error"
      show-icon
      closable
      class="mb-6"
      @close="error = null"
    />

    <a-table
      :columns="columns"
      :data-source="rows"
      row-key="id"
      bordered
      :loading="loading"
      class="bg-white rounded-lg shadow-sm overflow-hidden"
      :scroll="{ x: 1300 }"
    >
      <template #bodyCell="{ column, record, index }">
        <!-- Index -->
        <template v-if="column.key === 'index'">
          <span class="text-slate-600 font-semibold">{{ index + 1 }}</span>
        </template>

        <!-- Employee Name + Avatar -->
        <template v-else-if="column.key === 'name'">
          <div class="flex items-center gap-3">
            <a-avatar
              :size="36"
              class="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold"
            >
              {{ getInitials(record.employee) }}
            </a-avatar>
            <div>
              <div class="font-medium text-slate-800">
                {{ record.employee.first_name }} {{ record.employee.last_name }}
              </div>
              <div class="text-xs text-slate-500">
                ID: {{ record.employee.id.slice(0, 8) }}...
              </div>
            </div>
          </div>
        </template>

        <!-- Employee Code -->
        <template v-else-if="column.key === 'employee_code'">
          <a-tag color="geekblue" class="font-mono text-xs font-bold">
            {{ record.employee.employee_code || 'N/A' }}
          </a-tag>
        </template>

        <!-- Status -->
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 'present' ? 'green' : 'volcano'">
            <template #icon>
              <span
                class="w-2 h-2 rounded-full inline-block mr-1"
                :class="record.status === 'present' ? 'bg-green-500' : 'bg-red-500'"
              ></span>
            </template>
            {{ (record.status || 'unknown').toUpperCase() }}
          </a-tag>
        </template>

        <!-- Worked Time -->
        <template v-else-if="column.key === 'worked_minutes'">
          <span class="font-medium text-slate-700">
            {{ formatWorkedTime(record.worked_minutes) }}
          </span>
        </template>

        <!-- Late Minutes -->
        <template v-else-if="column.key === 'late_minutes'">
          <span
            :class="calculateLateMinutes(record) > 0 ? 'text-red-600 font-medium' : 'text-slate-500'"
          >
            {{ calculateLateMinutes(record) > 0 ? `${calculateLateMinutes(record)} mins` : '—' }}
          </span>
        </template>

        <!-- Action -->
        <template v-else-if="column.key === 'actions'">
          <a-button
            type="link"
            size="small"
            @click="openEmployee(record)"
          >
            View Details
          </a-button>
        </template>
      </template>

      <template #emptyText>
        <div class="py-16 text-center">
          <div class="text-6xl mb-4">👥</div>
          <p class="text-lg text-slate-500">No attendance records yet for today</p>
        </div>
      </template>
    </a-table>

    <!-- Drawer -->
    <EmployeeAttendanceDrawer
      :employee="selectedEmployee"
      :open="drawerVisible"
      @close="drawerVisible = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import api from '~/utils/api'
import { message } from 'ant-design-vue'

import EmployeeAttendanceDrawer from '@/components/attendance/EmployeeAttendanceDrawer.vue'
import AttendanceFilters from '@/components/attendance/AttendanceFilters.vue'

const { $echo } = useNuxtApp()

const rows = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const selectedEmployee = ref<any>(null)
const drawerVisible = ref(false)

const openEmployee = (record: any) => {
  selectedEmployee.value = record.employee
  drawerVisible.value = true
}

// Helpers
const getInitials = (emp: any) => {
  const first = emp?.first_name?.[0] || ''
  const last = emp?.last_name?.[0] || ''
  return (first + last).toUpperCase() || 'NA'
}

const formatWorkedTime = (minutes: number) => {
  if (!minutes) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

const calculateLateMinutes = (record: any) => {
  if (!record.clock_in) return 0
  const clockIn = new Date(record.clock_in)
  const expected = new Date(record.attendance_date)
  expected.setHours(9, 0, 0, 0)
  const diff = Math.floor((clockIn.getTime() - expected.getTime()) / 60000)
  return diff > 0 ? diff : 0
}

// Columns — exactly like Employees table
const columns = [
  { title: '#', key: 'index', width: 70, fixed: 'left' },
  { title: 'Employee', key: 'name', width: 300 },
  { title: 'Code', key: 'employee_code', width: 140 },
  { title: 'Status', key: 'status', width: 140 },
  { title: 'Worked', key: 'worked_minutes', width: 140 },
  { title: 'Late', key: 'late_minutes', width: 130 },
  { title: 'Action', key: 'actions', width: 120, fixed: 'right' },
]

// Fetch data
const fetchTodayAttendance = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/admin/attendance/today')
    rows.value = Array.isArray(res.data) ? res.data : res // handle both {data: []} or []
  } catch (err: any) {
    console.error('Failed to load attendance:', err)
    error.value = 'Failed to load today\'s attendance'
    message.error(error.value)
    rows.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchTodayAttendance()

  // Realtime
  $echo.private('attendance.hr')
    .listen('.attendance.recorded', (e: any) => {
      if (e?.attendance && e?.employee) {
        const fullRecord = { ...e.attendance, employee: e.employee }
        const exists = rows.value.some(r => r.id === fullRecord.id)
        if (!exists) {
          rows.value.unshift(fullRecord)
          message.success(`${e.employee.first_name} just clocked in!`)
        }
      }
    })
})
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background-color: #f1f5f9 !important;
  font-weight: 600;
  color: #334155;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f8fafc !important;
}
</style>