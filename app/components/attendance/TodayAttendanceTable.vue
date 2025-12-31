<!-- components/attendance/TodayAttendanceTable.vue -->
<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Today's Attendance</h1>
        <p class="text-slate-600 mt-1">December 31, 2025</p>
      </div>

      <!-- You can add a global "Manual Record All" button here later if needed -->
    </div>

    <!-- Error Alert -->
    <a-alert
      v-if="error"
      type="error"
      :message="error"
      show-icon
      closable
      class="mb-6 rounded-lg"
      @close="error = null"
    />

    <!-- Attendance Filters (if you have one) -->
    <div class="mb-6">
      <AttendanceFilters />
    </div>

    <!-- Table -->
    <a-table
      :columns="columns"
      :data-source="rows"
      row-key="id"
      bordered
      :loading="loading"
      class="bg-white rounded-xl shadow-lg overflow-hidden"
      :scroll="{ x: 1400 }"
    >
      <template #bodyCell="{ column, record, index }">
        <!-- Index -->
        <template v-if="column.key === 'index'">
          <span class="text-slate-600 font-semibold">{{ index + 1 }}</span>
        </template>

        <!-- Employee -->
        <template v-else-if="column.key === 'employee'">
          <div class="flex items-center gap-4">
            <a-avatar
              :size="44"
              class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-md"
            >
              {{ getInitials(record.employee) }}
            </a-avatar>
            <div>
              <div class="font-semibold text-slate-800 text-base">
                {{ record.employee.first_name }} {{ record.employee.last_name }}
              </div>
              <div class="text-sm text-slate-500">
                {{ record.employee.email }}
              </div>
            </div>
          </div>
        </template>

        <!-- Code -->
        <template v-else-if="column.key === 'code'">
          <a-tag color="blue" class="font-mono text-sm font-bold px-3 py-1">
            {{ record.employee.employee_code || 'N/A' }}
          </a-tag>
        </template>

        <!-- Status -->
        <template v-else-if="column.key === 'status'">
          <div class="flex items-center gap-2">
            <a-tag
              :color="record.status === 'present' ? 'green' : 'volcano'"
              class="text-sm font-medium px-3 py-1"
            >
              <check-circle-filled v-if="record.status === 'present'" class="mr-1" />
              <close-circle-filled v-else class="mr-1" />
              {{ (record.status || 'absent').toUpperCase() }}
            </a-tag>
          </div>
        </template>

        <!-- Worked -->
        <template v-else-if="column.key === 'worked'">
          <span class="font-medium text-slate-700 text-base">
            {{ formatWorkedTime(record.worked_minutes) }}
          </span>
        </template>

        <!-- Late -->
        <template v-else-if="column.key === 'late'">
          <span
            :class="calculateLateMinutes(record) > 0 ? 'text-red-600 font-bold' : 'text-slate-500'"
            class="text-base"
          >
            {{ calculateLateMinutes(record) > 0 ? `${calculateLateMinutes(record)} mins` : 'On Time' }}
          </span>
        </template>

        <!-- Actions -->
        <template v-else-if="column.key === 'actions'">
          <a-space :size="8">
            <a-button
              type="link"
              size="small"
              class="text-blue-600 font-medium"
              @click="openEmployeeDrawer(record.employee)"
            >
              View History
            </a-button>

            <!-- Manual Record Button -->
            <a-button
              v-if="userStore.can('record attendance')"
              type="primary"
              size="small"
              @click="openManualRecord(record.employee)"
            >
              Manual Record
            </a-button>
          </a-space>
        </template>
      </template>

      <!-- Empty State -->
      <template #emptyText>
        <a-empty
          description="No attendance recorded yet today"
          class="py-16"
        >
          <template #image>
            <div class="text-6xl mb-4">🕒</div>
          </template>
        </a-empty>
      </template>
    </a-table>

    <!-- Employee History Drawer -->
    <EmployeeAttendanceDrawer
      :employee="selectedEmployee"
      :open="drawerVisible"
      @close="drawerVisible = false"
    />

    <!-- Manual Record Modal -->
    <a-modal
      v-model:open="showManualRecord"
      title="Manual Attendance Record"
      width="550"
      centered
    >
      <div v-if="manualEmployee" class="mb-6">
        <div class="text-lg font-semibold text-slate-800">
          {{ manualEmployee.first_name }} {{ manualEmployee.last_name }}
        </div>
        <div class="text-sm text-slate-500">
          {{ manualEmployee.employee_code }} • {{ manualEmployee.email }}
        </div>
      </div>

      <a-form layout="vertical">
        <a-form-item label="Status" required>
          <a-select v-model:value="manualForm.status">
            <a-select-option value="present">Present</a-select-option>
            <a-select-option value="absent">Absent</a-select-option>
            <a-select-option value="late">Late</a-select-option>
            <a-select-option value="half_day">Half Day</a-select-option>
            <a-select-option value="leave">On Leave</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="Worked Minutes">
          <a-input-number
            v-model:value="manualForm.worked_minutes"
            :min="0"
            :max="1440"
            placeholder="e.g., 480 for 8 hours"
            style="width: 100%"
          />
        </a-form-item>

        <a-form-item label="Late Minutes">
          <a-input-number
            v-model:value="manualForm.late_minutes"
            :min="0"
            :max="480"
            placeholder="e.g., 30"
            style="width: 100%"
          />
        </a-form-item>
      </a-form>

      <template #footer>
        <a-button @click="showManualRecord = false">Cancel</a-button>
        <a-button
          type="primary"
          :loading="recording"
          @click="submitManualRecord"
        >
          Record Attendance
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import api from '~/utils/api'
import { message } from 'ant-design-vue'
import { useUserStore } from '~/stores/user'

import EmployeeAttendanceDrawer from '@/components/attendance/EmployeeAttendanceDrawer.vue'
import AttendanceFilters from '@/components/attendance/AttendanceFilters.vue'

const { $echo } = useNuxtApp()
const userStore = useUserStore()

const rows = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const selectedEmployee = ref<any>(null)
const drawerVisible = ref(false)

const showManualRecord = ref(false)
const recording = ref(false)
const manualEmployee = ref<any>(null)
const manualForm = ref({
  status: 'present',
  worked_minutes: 480,
  late_minutes: 0
})

const openEmployeeDrawer = (employee: any) => {
  selectedEmployee.value = employee
  drawerVisible.value = true
}

const openManualRecord = (employee: any) => {
  manualEmployee.value = employee
  manualForm.value = {
    status: 'present',
    worked_minutes: 480,
    late_minutes: 0
  }
  showManualRecord.value = true
}

const submitManualRecord = async () => {
  if (!manualEmployee.value?.id) return

  recording.value = true
  try {
    await api.post('/admin/attendance/record', {
      employee_id: manualEmployee.value.id,
      status: manualForm.value.status,
      worked_minutes: manualForm.value.worked_minutes,
      late_minutes: manualForm.value.late_minutes
    })

    message.success('Attendance recorded manually!')
    showManualRecord.value = false
    await fetchTodayAttendance()
  } catch (err: any) {
    message.error(err?.data?.message || 'Failed to record attendance')
  } finally {
    recording.value = false
  }
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

const columns = [
  { title: '#', key: 'index', width: 80, fixed: 'left' },
  { title: 'Employee', key: 'employee', width: 380 },
  { title: 'Code', key: 'code', width: 160 },
  { title: 'Status', key: 'status', width: 160 },
  { title: 'Worked', key: 'worked', width: 160 },
  { title: 'Late', key: 'late', width: 140 },
  { title: 'Actions', key: 'actions', width: 220, fixed: 'right' },
]

// Fetch today's attendance
const fetchTodayAttendance = async () => {
  loading.value = true
  error.value = null
  try {
    const res = await api.get('/admin/attendance/today')
    rows.value = Array.isArray(res.data) ? res.data : res || []
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

  // Realtime updates
  $echo.private('attendance.hr')
    .listen('.attendance.recorded', (e: any) => {
      if (e?.attendance && e?.employee) {
        const fullRecord = { ...e.attendance, employee: e.employee }
        const exists = rows.value.some(r => r.id === fullRecord.id)
        if (!exists) {
          rows.value.unshift(fullRecord)
          message.success(`${e.employee.first_name} clocked in!`)
        } else {
          // Update existing
          const idx = rows.value.findIndex(r => r.id === fullRecord.id)
          if (idx !== -1) rows.value[idx] = fullRecord
        }
      }
    })
})
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background-color: #f8fafc !important;
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f0f9ff !important;
  transition: background-color 0.2s;
}

:deep(.ant-table-row) {
  transition: all 0.2s;
}
</style>