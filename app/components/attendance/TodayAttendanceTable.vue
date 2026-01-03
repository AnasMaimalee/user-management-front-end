<template>
  <div>
    <!-- Error Alert -->
    <a-alert
      v-if="error"
      type="error"
      :message="error"
      show-icon
      closable
      class="mb-6 rounded-xl shadow-md"
      @close="error = null"
    />

    <!-- Table Card -->
    <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
      <!-- Header with Filters & Export -->
      <div class="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <!-- Title -->
          <div>
            <h2 class="text-2xl font-bold text-slate-800">
              {{ filterActive ? 'Filtered Attendance Records' : "Today's Attendance" }}
            </h2>
            <p class="text-slate-600 mt-1">
              {{ filteredRows.length }} record{{ filteredRows.length !== 1 ? 's' : '' }} found
            </p>
          </div>

          <!-- Actions: Filters + Export -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <!-- Filters -->
            <div class="flex flex-wrap items-center gap-3">
              <!-- Department -->
              <a-select
                v-model:value="filterDepartment"
                placeholder="Department"
                allow-clear
                style="width: 180px"
                @change="applyFilters"
              >
                <a-select-option v-for="dept in departments" :key="dept.id" :value="dept.id">
                  {{ dept.name }}
                </a-select-option>
              </a-select>

              <!-- Employee -->
              <a-select
                v-model:value="filterEmployee"
                placeholder="Employee"
                show-search
                allow-clear
                :options="employeeOptions"
                style="width: 220px"
                @change="applyFilters"
              />

              <!-- Month -->
              <a-select
                v-model:value="filterMonth"
                placeholder="Month"
                allow-clear
                style="width: 140px"
                @change="applyFilters"
              >
                <a-select-option v-for="(m, i) in months" :key="i + 1" :value="i + 1">
                  {{ m }}
                </a-select-option>
              </a-select>

              <!-- Year -->
              <a-select
                v-model:value="filterYear"
                placeholder="Year"
                allow-clear
                style="width: 120px"
                @change="applyFilters"
              >
                <a-select-option v-for="y in years" :key="y" :value="y">
                  {{ y }}
                </a-select-option>
              </a-select>

              <!-- Reset -->
              <a-button type="primary" danger @click="resetFilters">
                Reset All
              </a-button>
            </div>

            <!-- Export Buttons -->
            <div class="flex gap-3">
              <a-button
                v-if="filteredRows.length > 0"
                type="default"
                danger
                @click="exportPDF"
                :loading="exportingPDF"
                class="px-6 shadow-md"
              >
                Export PDF
              </a-button>

              <a-button
                v-if="filteredRows.length > 0"
                type="default"
                @click="exportExcel"
                :loading="exportingExcel"
                class="px-6 shadow-md"
              >
                Export Excel
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <a-table
        :columns="columns"
        :data-source="filteredRows"
        row-key="id"
        :pagination="{ pageSize: 15 }"
        :loading="loading"
        :scroll="{ x: 1400 }"
        class="text-left"
      >
        <template #emptyText>
          <div class="py-20 text-center">
            <div class="text-8xl text-slate-200 mb-6">📭</div>
            <p class="text-2xl text-slate-600 font-medium">No attendance records</p>
            <p class="text-lg text-slate-500 mt-3">
              {{ filterActive ? 'Try different filters' : 'No one has clocked in yet today' }}
            </p>
          </div>
        </template>

        <template #bodyCell="{ column, record, index }">
          <!-- Numbering -->
          <template v-if="column.key === 'no'">
            <span class="text-slate-700 font-semibold text-lg">{{ index + 1 }}</span>
          </template>

          <!-- Employee -->
          <template v-else-if="column.key === 'employee'">
            <div class="flex items-center gap-4">
              <a-avatar
                :size="48"
                class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xl shadow-lg"
              >
                {{ getInitials(record.employee) }}
              </a-avatar>
              <div>
                <div class="font-bold text-slate-800 text-lg">
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
            <a-tag color="blue" class="font-mono text-sm font-bold px-4 py-2 rounded-lg">
              {{ record.employee.employee_code || 'N/A' }}
            </a-tag>
          </template>

          <!-- Status -->
          <template v-else-if="column.key === 'status'">
            <a-tag
              :color="record.status === 'present' ? 'green' : 'volcano'"
              class="px-5 py-2 text-base font-bold rounded-full shadow-sm"
            >
              {{ (record.status || 'absent').toUpperCase() }}
            </a-tag>
          </template>

          <!-- Worked -->
          <template v-else-if="column.key === 'worked'">
            <span class="text-xl font-bold text-slate-800">
              {{ formatWorkedTime(record.worked_minutes) }}
            </span>
          </template>

          <!-- Late -->
          <template v-else-if="column.key === 'late'">
            <span
              :class="calculateLateMinutes(record) > 0 ? 'text-red-600 font-bold' : 'text-green-600'"
              class="text-lg"
            >
              {{ calculateLateMinutes(record) > 0 ? `${calculateLateMinutes(record)} mins late` : 'On Time' }}
            </span>
          </template>

          <!-- Actions -->
          <template v-else-if="column.key === 'actions'">
            <a-space :size="12">
              <a-button
                type="link"
                class="text-indigo-600 font-semibold hover:text-indigo-800"
                @click="openEmployeeDrawer(record.employee)"
              >
                View History
              </a-button>

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
      </a-table>
    </div>

    <!-- Employee Drawer -->
    <EmployeeAttendanceDrawer
      :employee="selectedEmployee"
      :open="drawerVisible"
      @close="drawerVisible = false"
    />

    <!-- Manual Record Modal -->
    <a-modal
      v-model:open="showManualRecord"
      title="Manual Attendance Record"
      width="600px"
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
import { ref, computed, onMounted } from 'vue'
import api from '~/utils/api'
import { message, notification } from 'ant-design-vue'
import { useUserStore } from '~/stores/user'
import EmployeeAttendanceDrawer from '@/components/attendance/EmployeeAttendanceDrawer.vue'

const props = defineProps<{
  filter?: { from: string; to: string } | null
}>()

const rows = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const userStore = useUserStore()

// Filters
const filterDepartment = ref<string | null>(null)
const filterEmployee = ref<string | null>(null)
const filterMonth = ref<number | null>(null)
const filterYear = ref<number | null>(null)

const departments = ref<any[]>([])
const employees = ref<any[]>([])

const years = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => current - i)
})

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const employeeOptions = computed(() => {
  return employees.value.map(e => ({
    value: e.id,
    label: `${e.first_name} ${e.last_name} (${e.employee_code})`
  }))
})

// Filtered rows (client-side)
const filteredRows = computed(() => {
  let data = rows.value

  if (filterDepartment.value) {
    data = data.filter(r => r.employee.department_id === filterDepartment.value)
  }

  if (filterEmployee.value) {
    data = data.filter(r => r.employee.id === filterEmployee.value)
  }

  if (filterMonth.value || filterYear.value) {
    data = data.filter(r => {
      const date = new Date(r.created_at || r.attendance_date)
      const month = date.getMonth() + 1
      const year = date.getFullYear()
      return (!filterMonth.value || month === filterMonth.value) &&
             (!filterYear.value || year === filterYear.value)
    })
  }

  return data
})

const filterActive = computed(() => 
  !!filterDepartment.value || !!filterEmployee.value || !!filterMonth.value || !!filterYear.value
)

// Load filters
const loadFilters = async () => {
  try {
    const [deptRes, empRes] = await Promise.all([
      api.get('/departments'),
      api.get('/employees')
    ])
    departments.value = deptRes.data
    employees.value = empRes.data
  } catch (err) {
    console.error('Failed to load filters')
  }
}

// Fetch attendance
const fetchAttendance = async () => {
  loading.value = true
  error.value = null
  try {
    let url = '/admin/attendance/today'
    let params: any = {}

    if (props.filter) {
      url = '/admin/attendance/report'
      params = { from: props.filter.from, to: props.filter.to }
    }

    const res = await api.get(url, { params })
    rows.value = Array.isArray(res.data) ? res.data : res.data?.data || []
  } catch (err: any) {
    error.value = 'Failed to load attendance data'
    notification.error({ message: error.value })
    rows.value = []
  } finally {
    loading.value = false
  }
}

// Apply filters
const applyFilters = () => {
  // Client-side filtering via computed
}

// Reset filters
const resetFilters = () => {
  filterDepartment.value = null
  filterEmployee.value = null
  filterMonth.value = null
  filterYear.value = null
}

// Export loading states
const exportingPDF = ref(false)
const exportingExcel = ref(false)

// Export PDF - respects current filters (employee + department + month/year)
const exportPDF = async () => {
  exportingPDF.value = true
  try {
    const params = {}

    // ────────────────────────────────────────────────
    // Determine date range based on current filters
    // ────────────────────────────────────────────────
    let fromDate, toDate

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    if (filterMonth.value && filterYear.value) {
      // Specific month + year selected
      fromDate = new Date(filterYear.value, filterMonth.value - 1, 1)
      toDate = new Date(filterYear.value, filterMonth.value, 0)
    } else if (filterMonth.value) {
      // Only month selected → assume current year
      fromDate = new Date(currentYear, filterMonth.value - 1, 1)
      toDate = new Date(currentYear, filterMonth.value, 0)
    } else if (filterYear.value) {
      // Only year selected → full year
      fromDate = new Date(filterYear.value, 0, 1)
      toDate = new Date(filterYear.value, 11, 31)
    } else {
      // No date filter → default to last 31 days
      toDate = new Date()
      fromDate = new Date()
      fromDate.setDate(toDate.getDate() - 31)
    }

    params.from = fromDate.toISOString().split('T')[0]
    params.to = toDate.toISOString().split('T')[0]

    // Add other filters
    if (filterDepartment.value) {
      params.department_id = filterDepartment.value
    }
    if (filterEmployee.value) {
      params.employee_id = filterEmployee.value
    }

    // Optional: nicer filename
    let filename = `Attendance-${params.from}_to_${params.to}`
    if (filterEmployee.value) {
      const emp = employees.value.find(e => e.id === filterEmployee.value)
      if (emp) {
        const name = `${emp.first_name}-${emp.last_name}`.toLowerCase().replace(/\s+/g, '-')
        filename += `_${name}`
      }
    }
    filename += '.pdf'

    const res = await api.get('/admin/attendance/export/pdf', {
      params,
      responseType: 'blob',
      timeout: 90000 // longer timeout for large reports
    })

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    message.success('PDF exported successfully!')
  } catch (err) {
    console.error('PDF export error:', err)
    message.error(err.response?.data?.message || 'Failed to export PDF')
  } finally {
    exportingPDF.value = false
  }
}

// Export Excel - same logic
const exportExcel = async () => {
  exportingExcel.value = true
  try {
    const params = {}

    // Same date range logic as PDF
    let fromDate, toDate
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    if (filterMonth.value && filterYear.value) {
      fromDate = new Date(filterYear.value, filterMonth.value - 1, 1)
      toDate = new Date(filterYear.value, filterMonth.value, 0)
    } else if (filterMonth.value) {
      fromDate = new Date(currentYear, filterMonth.value - 1, 1)
      toDate = new Date(currentYear, filterMonth.value, 0)
    } else if (filterYear.value) {
      fromDate = new Date(filterYear.value, 0, 1)
      toDate = new Date(filterYear.value, 11, 31)
    } else {
      toDate = new Date()
      fromDate = new Date()
      fromDate.setDate(toDate.getDate() - 31)
    }

    params.from = fromDate.toISOString().split('T')[0]
    params.to = toDate.toISOString().split('T')[0]

    if (filterDepartment.value) params.department_id = filterDepartment.value
    if (filterEmployee.value) params.employee_id = filterEmployee.value

    let filename = `Attendance-${params.from}_to_${params.to}`
    if (filterEmployee.value) {
      const emp = employees.value.find(e => e.id === filterEmployee.value)
      if (emp) {
        const name = `${emp.first_name}-${emp.last_name}`.toLowerCase().replace(/\s+/g, '-')
        filename += `_${name}`
      }
    }
    filename += '.xlsx'

    const res = await api.get('/admin/attendance/export/excel', {
      params,
      responseType: 'blob',
      timeout: 90000
    })

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    message.success('Excel exported successfully!')
  } catch (err) {
    console.error('Excel export error:', err)
    message.error(err.response?.data?.message || 'Failed to export Excel')
  } finally {
    exportingExcel.value = false
  }
}
// Manual record & drawer logic (unchanged)
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
  manualForm.value = { status: 'present', worked_minutes: 480, late_minutes: 0 }
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
    await fetchAttendance()
  } catch (err: any) {
    message.error(err?.response?.data?.message || 'Failed to record attendance')
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
  const expected = new Date(record.attendance_date || record.created_at)
  expected.setHours(9, 0, 0, 0)
  const diff = Math.floor((clockIn.getTime() - expected.getTime()) / 60000)
  return diff > 0 ? diff : 0
}

const columns = [
  { title: '#', key: 'no', width: 80, fixed: 'left' },
  { title: 'Employee', key: 'employee', width: 380 },
  { title: 'Code', key: 'code', width: 160 },
  { title: 'Status', key: 'status', width: 160 },
  { title: 'Worked', key: 'worked', width: 160 },
  { title: 'Late', key: 'late', width: 160 },
  { title: 'Actions', key: 'actions', width: 240, fixed: 'right' },
]

onMounted(async () => {
  await Promise.all([fetchAttendance(), loadFilters()])
})
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background: linear-gradient(to right, #f8fafc, #f1f5f9) !important;
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f0f9ff !important;
}
</style>