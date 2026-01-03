<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import api from '~/utils/api'
import AttendanceChart from '@/components/attendance/AttendanceChart.vue'

// Loading states
const loading = ref(false)
const exportingPdf = ref(false)
const exportingExcel = ref(false)

// Data
const summary = ref<any>(null)
const history = ref<any[]>([])

// Filters
const selectedMonth = ref<number | null>(null)
const selectedYear = ref<number | null>(null)

// Years & Months
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 11 }, (_, i) => currentYear - i)

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Computed values
const totalDays = computed(() => {
  return (summary.value?.present_days ?? 0) + (summary.value?.absent_days ?? 0) + (summary.value?.half_days ?? 0)
})

const attendanceRate = computed(() => {
  if (!totalDays.value) return 0
  return Math.round(((summary.value?.present_days ?? 0) / totalDays.value) * 100)
})

const performanceGrade = computed(() => {
  const r = attendanceRate.value
  if (r >= 95) return 'Excellent'
  if (r >= 85) return 'Good'
  if (r >= 70) return 'Average'
  return 'Needs Improvement'
})

const performanceColor = computed(() => {
  const r = attendanceRate.value
  if (r >= 95) return 'text-green-600'
  if (r >= 85) return 'text-blue-600'
  if (r >= 70) return 'text-yellow-600'
  return 'text-red-600'
})

// Table columns
const columns = [
  { title: 'S/N', key: 'index', width: 80 },
  { title: 'Date', dataIndex: 'attendance_date', width: 140 },
  { title: 'Status', key: 'status', width: 120 },
  { title: 'Check In', key: 'check_in', width: 140 },
  { title: 'Check Out', key: 'check_out', width: 140 }
]

const statusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'present': return 'green'
    case 'half_day': case 'half': return 'orange'
    case 'absent': return 'red'
    default: return 'default'
  }
}

// Helper: Format time (HH:MM AM/PM)
const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString) return '-'
  const date = new Date(timeString)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

// Format date if needed (optional)
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-GB') // DD/MM/YYYY
}

// Fetch data
const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {}

    if (selectedMonth.value || selectedYear.value) {
      let from: string, to: string

      if (selectedMonth.value && selectedYear.value) {
        from = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-01`
        const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
        to = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${lastDay}`
      } else if (selectedYear.value) {
        from = `${selectedYear.value}-01-01`
        to = `${selectedYear.value}-12-31`
      } else {
        const y = currentYear
        from = `${y}-${String(selectedMonth.value).padStart(2, '0')}-01`
        const lastDay = new Date(y, selectedMonth.value!, 0).getDate()
        to = `${y}-${String(selectedMonth.value).padStart(2, '0')}-${lastDay}`
      }
      params.from = from
      params.to = to
    }

    const [summaryRes, historyRes] = await Promise.all([
      api.get('/employee/attendance/summary', { params }),
      api.get('/employee/attendance/history', { params })
    ])

    summary.value = summaryRes.data
    history.value = Array.isArray(historyRes.data?.data)
      ? historyRes.data.data
      : Array.isArray(historyRes.data)
        ? historyRes.data
        : []
  } catch (err) {
    console.error('Fetch error:', err)
    message.error('Failed to load attendance data')
    summary.value = null
    history.value = []
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  selectedMonth.value = null
  selectedYear.value = null
  fetchData()
}

// Export functions
const exportPdf = async () => {
  // Same logic as fetchData for params...
  // (reuse the same date calculation)
  exportingPdf.value = true
  try {
    const params = buildDateParams()
    const res = await api.get('/employee/attendance/my/export/pdf', {
      params,
      responseType: 'blob'
    })
    downloadBlob(res.data, `attendance-${params.from || 'all'}-to-${params.to || 'all'}.pdf`)
  } catch (err) {
    message.error('PDF export failed')
  } finally {
    exportingPdf.value = false
  }
}

const exportExcel = async () => {
  exportingExcel.value = true
  try {
    const params = buildDateParams()
    const res = await api.get('/employee/attendance/my/export/excel', {
      params,
      responseType: 'blob'
    })
    downloadBlob(res.data, `attendance-${params.from || 'all'}-to-${params.to || 'all'}.xlsx`)
  } catch (err) {
    message.error('Excel export failed')
  } finally {
    exportingExcel.value = false
  }
}

const buildDateParams = (): any => {
  const params: any = {}
  if (selectedMonth.value || selectedYear.value) {
    let from: string, to: string
    if (selectedMonth.value && selectedYear.value) {
      from = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-01`
      const lastDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
      to = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}-${lastDay}`
    } else if (selectedYear.value) {
      from = `${selectedYear.value}-01-01`
      to = `${selectedYear.value}-12-31`
    } else {
      const y = currentYear
      from = `${y}-${String(selectedMonth.value).padStart(2, '0')}-01`
      const lastDay = new Date(y, selectedMonth.value!, 0).getDate()
      to = `${y}-${String(selectedMonth.value).padStart(2, '0')}-${lastDay}`
    }
    params.from = from
    params.to = to
  }
  return params
}

const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.URL.revokeObjectURL(url)
}

onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50">
    <div class="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">

      <!-- Header -->
      <div class="mb-10 text-center">
        <h1 class="text-4xl font-extrabold text-slate-800 mb-2">My Attendance Dashboard</h1>
        <p class="text-slate-600 text-lg">Track your presence and performance</p>
      </div>

      <!-- Filters + Export -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-10">
        <div class="flex flex-wrap gap-4 items-end justify-between">
          <div class="flex flex-wrap gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Month</label>
              <a-select
                v-model:value="selectedMonth"
                placeholder="Select month"
                allow-clear
                style="width: 160px"
                @change="fetchData"
              >
                <a-select-option v-for="(name, idx) in months" :key="idx + 1" :value="idx + 1">
                  {{ name }}
                </a-select-option>
              </a-select>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Year</label>
              <a-select
                v-model:value="selectedYear"
                placeholder="Select year"
                allow-clear
                style="width: 140px"
                @change="fetchData"
              >
                <a-select-option v-for="y in years" :key="y" :value="y">{{ y }}</a-select-option>
              </a-select>
            </div>

            <a-button type="default" @click="resetFilters" class="mt-6">Reset</a-button>
          </div>

          <div class="flex gap-3">
            <a-button
              type="primary"
              :loading="exportingPdf"
              @click="exportPdf"
              :disabled="history.length === 0"
            >
              Export PDF
            </a-button>
            <a-button
              :loading="exportingExcel"
              @click="exportExcel"
              :disabled="history.length === 0"
            >
              Export Excel
            </a-button>
          </div>
        </div>
      </div>

      <a-spin :spinning="loading" tip="Loading your attendance..." size="large">

        <!-- Stats Cards -->
        <a-row :gutter="[16, 24]" class="mb-10">
          <a-col :xs="24" :sm="12" :md="6">
            <div class="bg-white rounded-xl shadow p-6 text-center">
              <div class="text-3xl font-bold text-green-600">{{ summary?.present_days ?? 0 }}</div>
              <div class="text-slate-600 mt-2">Present Days</div>
            </div>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <div class="bg-white rounded-xl shadow p-6 text-center">
              <div class="text-3xl font-bold text-red-600">{{ summary?.absent_days ?? 0 }}</div>
              <div class="text-slate-600 mt-2">Absent Days</div>
            </div>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <div class="bg-white rounded-xl shadow p-6 text-center">
              <div class="text-3xl font-bold text-blue-600">{{ attendanceRate }}%</div>
              <div class="text-slate-600 mt-2">Attendance Rate</div>
            </div>
          </a-col>
          <a-col :xs="24" :sm="12" :md="6">
            <div class="bg-white rounded-xl shadow p-6 text-center">
              <div class="text-3xl font-bold" :class="performanceColor">{{ performanceGrade }}</div>
              <div class="text-slate-600 mt-2">Performance</div>
            </div>
          </a-col>
        </a-row>

        <!-- Pie Chart (your beautiful one) -->
        <div class="bg-white rounded-2xl shadow-lg p-8 mb-10">
          <h2 class="text-2xl font-bold text-slate-800 mb-6 text-center">Attendance Overview</h2>
          <div class="max-w-md mx-auto">
            <AttendanceChart
              :present-days="summary?.present_days ?? 0"
              :half-days="summary?.half_days ?? 0"
              :absent-days="summary?.absent_days ?? 0"
            />
          </div>
          <p class="text-center mt-6 text-slate-600">
            Total Working Days: <span class="font-semibold">{{ totalDays }}</span>
          </p>
        </div>

        <!-- History Table -->
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div class="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-slate-800">Attendance History</h2>
              <p class="text-sm text-slate-600 mt-1">Your daily attendance records</p>
            </div>
            <a-tag color="blue">{{ history.length }} records</a-tag>
          </div>

          <a-table
            :columns="columns"
            :data-source="history"
            row-key="id"
            :pagination="{ pageSize: 10 }"
          >
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'index'">
                {{ index + 1 }}
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="statusColor(record.status)">
                  {{ (record.status || 'absent').toUpperCase() }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'check_in'">
                {{ formatTime(record.clock_in) }}
              </template>
              <template v-else-if="column.key === 'check_out'">
                {{ formatTime(record.clock_out) }}
              </template>
              <template v-else-if="column.dataIndex === 'attendance_date'">
                {{ formatDate(record.attendance_date) }}
              </template>
            </template>
          </a-table>
        </div>
      </a-spin>
    </div>
  </div>
</template>