<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import api from '~/utils/api'
import AttendanceChart from '@/components/attendance/AttendanceChart.vue'

const loading = ref(false)
const exportingPdf = ref(false)
const exportingExcel = ref(false)

const summary = ref<any>(null)
const history = ref<any[]>([])

const selectedMonth = ref<number | null>(null)
const selectedYear = ref<number | null>(null)

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 11 }, (_, i) => currentYear - i)
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Computed Stats
const totalWorkingDays = computed(() => {
  if (!summary.value) return 0
  return (summary.value.present_days ?? 0) + (summary.value.late_days ?? 0) + (summary.value.absent_days ?? 0)
})

const attendanceRate = computed(() => {
  const attended = (summary.value?.present_days ?? 0) + (summary.value?.late_days ?? 0)
  return totalWorkingDays.value === 0 ? 0 : Math.round((attended / totalWorkingDays.value) * 100)
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
  if (r >= 95) return 'text-green-500'
  if (r >= 85) return 'text-blue-500'
  if (r >= 70) return 'text-yellow-500'
  return 'text-red-500'
})

// Status Colors
const statusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case 'present': return 'green'
    case 'late': return 'orange'
    case 'absent': return 'red'
    case 'on_leave': return 'blue'
    case 'holiday': return 'purple'
    default: return 'default'
  }
}

// Format Time: "14:30:00" → "2:30 PM"
const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString || !timeString.includes(':')) return '-'
  const [hours, minutes] = timeString.split(':').map(Number)
  const ampm = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 || 12
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`
}

// Format Date: "2026-01-15" → "15 Jan 2026"
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Table Columns
const columns = [
  { title: 'S/N', key: 'sn', width: 80 },
  { title: 'Date', dataIndex: 'attendance_date', key: 'date', width: 160, sorter: (a: any, b: any) => new Date(a.attendance_date) - new Date(b.attendance_date), defaultSortOrder: 'descend' },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 140, filters: [
    { text: 'Present', value: 'present' },
    { text: 'Late', value: 'late' },
    { text: 'Absent', value: 'absent' },
    { text: 'On Leave', value: 'on_leave' },
    { text: 'Holiday', value: 'holiday' },
  ], onFilter: (value: string, record: any) => record.status?.toLowerCase() === value.toLowerCase() },
  { title: 'Check In', dataIndex: 'clock_in', key: 'check_in', width: 140 },
  { title: 'Check Out', dataIndex: 'clock_out', key: 'check_out', width: 140 },
]

// FETCH DATA - FULLY IMPLEMENTED
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
    console.error('Failed to fetch attendance:', err)
    message.error('Unable to load attendance data. Please try again.')
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

// BUILD DATE PARAMS FOR EXPORT
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

// DOWNLOAD BLOB
const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

// EXPORT PDF
const exportPdf = async () => {
  exportingPdf.value = true
  try {
    const params = buildDateParams()
    const res = await api.get('/employee/attendance/my/export/pdf', {
      params,
      responseType: 'blob'
    })
    const dateSuffix = params.from ? `_${params.from}_to_${params.to}` : ''
    downloadBlob(res.data, `My_Attendance${dateSuffix}.pdf`)
    message.success('PDF exported successfully!')
  } catch (err) {
    message.error('Failed to export PDF')
  } finally {
    exportingPdf.value = false
  }
}

// EXPORT EXCEL
const exportExcel = async () => {
  exportingExcel.value = true
  try {
    const params = buildDateParams()
    const res = await api.get('/employee/attendance/my/export/excel', {
      params,
      responseType: 'blob'
    })
    const dateSuffix = params.from ? `_${params.from}_to_${params.to}` : ''
    downloadBlob(res.data, `My_Attendance${dateSuffix}.xlsx`)
    message.success('Excel exported successfully!')
  } catch (err) {
    message.error('Failed to export Excel')
  } finally {
    exportingExcel.value = false
  }
}

// Load data on mount
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
    <div class="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">

      <!-- Left-Aligned Header -->
      <div class="mb-12">
        <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight">
          My Attendance Dashboard
        </h1>
        <p class="mt-3 text-lg text-slate-600 max-w-2xl">
          Track your daily attendance, performance trends, and export reports with ease.
        </p>
      </div>

      <a-spin :spinning="loading" tip="Loading your attendance records..." size="large">

        <!-- Stats Cards -->
        <a-row :gutter="[20, 20]" class="mb-12">
          <a-col :xs="24" :sm="12" :lg="6">
            <div class="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-slate-100">
              <div class="text-4xl font-bold text-green-600">
                {{ (summary?.present_days ?? 0) + (summary?.late_days ?? 0) }}
              </div>
              <div class="mt-2 text-slate-600 font-medium">Attended Days</div>
            </div>
          </a-col>
          <a-col :xs="24" :sm="12" :lg="6">
            <div class="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-slate-100">
              <div class="text-4xl font-bold text-red-600">{{ summary?.absent_days ?? 0 }}</div>
              <div class="mt-2 text-slate-600 font-medium">Absent Days</div>
            </div>
          </a-col>
          <a-col :xs="24" :sm="12" :lg="6">
            <div class="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-slate-100">
              <div class="text-4xl font-bold text-indigo-600">{{ attendanceRate }}%</div>
              <div class="mt-2 text-slate-600 font-medium">Attendance Rate</div>
            </div>
          </a-col>
          <a-col :xs="24" :sm="12" :lg="6">
            <div class="bg-white/80 backdrop-blur rounded-2xl shadow-lg p-6 border border-slate-100">
              <div class="text-4xl font-bold" :class="performanceColor">{{ performanceGrade }}</div>
              <div class="mt-2 text-slate-600 font-medium">Performance</div>
            </div>
          </a-col>
        </a-row>

        <!-- Pie Chart Section (Removed for now - will be added back once AttendanceChart is ready) -->
        <!-- You can re-add it here when your AttendanceChart component is complete -->

        <!-- Attendance History Section -->
        <div class="bg-white/90 backdrop-blur rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div class="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <h2 class="text-2xl font-bold">Attendance History</h2>
            <p class="mt-1 opacity-90">View and filter your daily attendance records</p>
          </div>

          <!-- Filters & Export Buttons -->
          <div class="p-6 border-b border-slate-200 bg-slate-50">
            <div class="flex flex-wrap items-center justify-between gap-4">
              <div class="flex flex-wrap items-center gap-4">
                <a-select
                  v-model:value="selectedMonth"
                  placeholder="Month"
                  allow-clear
                  style="width: 160px"
                  @change="fetchData"
                >
                  <a-select-option v-for="(name, idx) in months" :key="idx + 1" :value="idx + 1">
                    {{ name }}
                  </a-select-option>
                </a-select>

                <a-select
                  v-model:value="selectedYear"
                  placeholder="Year"
                  allow-clear
                  style="width: 140px"
                  @change="fetchData"
                >
                  <a-select-option v-for="y in years" :key="y" :value="y">{{ y }}</a-select-option>
                </a-select>

                <a-button type="default" @click="resetFilters">Reset</a-button>
              </div>

              <div class="flex gap-3">
                <a-button type="primary" :loading="exportingPdf" @click="exportPdf" :disabled="history.length === 0">
                  Export PDF
                </a-button>
                <a-button :loading="exportingExcel" @click="exportExcel" :disabled="history.length === 0">
                  Export Excel
                </a-button>
              </div>
            </div>
          </div>

          <!-- Table -->
          <a-table
            :columns="columns"
            :data-source="history"
            row-key="id"
            :pagination="{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ['10', '20', '50'] }"
            class="custom-table"
          >
            <template #sn="{ index }">
              <span class="font-medium text-slate-700">{{ index + 1 }}</span>
            </template>

            <template #date="{ record }">
              <span class="font-medium">{{ formatDate(record.attendance_date) }}</span>
            </template>

            <template #status="{ record }">
              <a-tag
                :color="statusColor(record.status)"
                class="px-3 py-1 text-sm font-medium rounded-full"
              >
                {{ (record.status || 'absent').replace('_', ' ').toUpperCase() }}
              </a-tag>
            </template>

            <template #check_in="{ record }">
              <span class="font-mono text-slate-700">{{ formatTime(record.clock_in) }}</span>
            </template>

            <template #check_out="{ record }">
              <span class="font-mono text-slate-700">{{ formatTime(record.clock_out) }}</span>
            </template>
          </a-table>
        </div>
      </a-spin>
    </div>
  </div>
</template>
