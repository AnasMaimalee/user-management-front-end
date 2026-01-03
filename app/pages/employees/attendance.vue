<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
    <h1 class="text-3xl font-bold text-slate-800 mb-8">My Attendance Dashboard</h1>

    <a-alert
      v-if="error"
      type="error"
      :message="error"
      show-icon
      closable
      class="mb-8"
      @close="error = null"
    />

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
      <div class="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
        <div class="text-4xl font-bold text-green-600">{{ summary?.present_days ?? 0 }}</div>
        <p class="text-slate-600 font-medium">Present Days</p>
      </div>
      <div class="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
        <div class="text-4xl font-bold text-orange-600">{{ summary?.late_days ?? 0 }}</div>
        <p class="text-slate-600 font-medium">Late Days</p>
      </div>
      <div class="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
        <div class="text-4xl font-bold text-red-600">{{ summary?.absent_days ?? 0 }}</div>
        <p class="text-slate-600 font-medium">Absent Days</p>
      </div>
      <div class="bg-white rounded-2xl shadow-md p-6 border border-slate-100">
        <div class="text-4xl font-bold" :class="performanceColor">{{ attendanceRate }}%</div>
        <p class="text-slate-600 font-medium">Attendance Rate</p>
      </div>
    </div>

    <!-- Attendance History Section -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div class="p-6 border-b border-slate-200 bg-slate-50">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold text-slate-800">Attendance History</h2>

          <!-- Filter Dropdown Card -->
          <a-dropdown :trigger="['click']" v-model:open="filterOpen">
            <a-button type="primary">
              <FilterOutlined class="mr-2" />
              Filters
              <DownOutlined class="ml-2" />
            </a-button>
            <template #overlay>
              <div class="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-96">
                <h3 class="text-lg font-semibold text-slate-800 mb-5">Filter by Month & Year</h3>
                <div class="space-y-5">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Month</label>
                    <a-select
                      v-model:value="selectedMonth"
                      placeholder="All months"
                      allow-clear
                      class="w-full"
                      @change="fetchData"
                    >
                      <a-select-option :value="null">All</a-select-option>
                      <a-select-option v-for="(name, index) in monthNames" :key="index + 1" :value="index + 1">
                        {{ name }}
                      </a-select-option>
                    </a-select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Year</label>
                    <a-select
                      v-model:value="selectedYear"
                      placeholder="All years"
                      allow-clear
                      class="w-full"
                      @change="fetchData"
                    >
                      <a-select-option :value="null">All</a-select-option>
                      <a-select-option v-for="y in years" :key="y" :value="y">{{ y }}</a-select-option>
                    </a-select>
                  </div>
                </div>
                <div class="mt-6 flex justify-end">
                  <a-button type="default" @click="resetFilters">
                    Reset Filters
                  </a-button>
                </div>
              </div>
            </template>
          </a-dropdown>
        </div>

        <!-- Refresh + Export Buttons -->
        <div class="flex justify-end gap-3">
          <a-button type="default" @click="fetchData" :loading="loading">
            <ReloadOutlined class="mr-2" />
            Refresh
          </a-button>
          <a-button
            type="primary"
            danger
            @click="exportPdf"
            :loading="exportingPdf"
            :disabled="filteredHistory.length === 0"
          >
            Export PDF
          </a-button>
          <a-button
            type="primary"
            @click="exportExcel"
            :loading="exportingExcel"
            :disabled="filteredHistory.length === 0"
          >
            Export Excel
          </a-button>
        </div>
      </div>

      <!-- Attendance Table -->
      <a-table
        :columns="columns"
        :data-source="filteredHistory"
        row-key="id"
        :loading="loading"
        bordered
        class="attendance-table"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">
            <span class="font-medium text-slate-700">{{ index + 1 }}</span>
          </template>
          <template v-else-if="column.key === 'date'">
            <span class="font-medium">{{ formatDate(record.attendance_date) }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)" class="px-3 py-1 text-sm font-medium rounded-full">
              {{ (record.status || 'absent').replace('_', ' ').toUpperCase() }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'check_in'">
            <span class="font-mono text-slate-700">{{ formatTime(record.clock_in) }}</span>
          </template>
          <template v-else-if="column.key === 'check_out'">
            <span class="font-mono text-slate-700">{{ formatTime(record.clock_out) }}</span>
          </template>
        </template>

        <template #emptyText>
          <div class="py-16 text-center">
            <div class="text-8xl text-slate-100 mb-4">📅</div>
            <p class="text-2xl font-medium text-slate-700">No attendance records found</p>
            <p class="text-slate-500">Try adjusting the filters or check back later</p>
          </div>
        </template>
      </a-table>
    </div>

    <!-- Request Leave Modal -->
    <a-modal
      v-model:open="showCreateModal"
      title="Request New Leave"
      :confirm-loading="createLoading"
      @ok="handleCreate"
      ok-text="Submit Request"
      cancel-text="Cancel"
      width="600px"
    >
      <a-form layout="vertical">
        <a-form-item label="Leave Dates" :rules="[{ required: true, message: 'Please select dates' }]">
          <a-range-picker
            v-model:value="form.dateRange"
            :placeholder="['Start Date', 'End Date']"
            class="w-full"
            :disabled-date="disabledDate"
            format="MMM D, YYYY"
          />
        </a-form-item>
        <a-form-item label="Reason" :rules="[{ required: true, message: 'Please provide reason' }, { min: 10, message: 'Reason must be at least 10 characters' }]">
          <a-textarea
            v-model:value="form.reason"
            placeholder="Explain why you need this leave..."
            :rows="4"
            :maxlength="255"
            show-count
          />
        </a-form-item>
        <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p class="text-sm font-medium text-blue-800">
            Resume Date: {{ resumeDate ? formatDate(resumeDate) : '—' }}
          </p>
          <p class="text-xs text-blue-600 mt-1">
            You will return to work the day after your leave ends.
          </p>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'
import { FilterOutlined, ReloadOutlined, PlusOutlined, DownOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const exportingPdf = ref(false)
const exportingExcel = ref(false)
const showCreateModal = ref(false)
const createLoading = ref(false)
const filterOpen = ref(false)

const summary = ref<any>(null)
const history = ref<any[]>([])

const selectedMonth = ref<number | null>(null)
const selectedYear = ref<number | null>(null)

const currentYear = dayjs().year()
const years = Array.from({ length: 11 }, (_, i) => currentYear - i)

const monthNames = computed(() => 
  Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMMM'))
)

const filteredHistory = computed(() => {
  return history.value.filter(record => {
    if (selectedMonth.value && dayjs(record.attendance_date).month() + 1 !== selectedMonth.value) return false
    if (selectedYear.value && dayjs(record.attendance_date).year() !== selectedYear.value) return false
    return true
  })
})

const attendanceRate = computed(() => {
  const attended = (summary.value?.present_days ?? 0) + (summary.value?.late_days ?? 0)
  const total = attended + (summary.value?.absent_days ?? 0)
  return total === 0 ? 0 : Math.round((attended / total) * 100)
})

const performanceColor = computed(() => {
  const r = attendanceRate.value
  if (r >= 95) return 'text-green-600'
  if (r >= 85) return 'text-blue-600'
  if (r >= 70) return 'text-yellow-600'
  return 'text-red-600'
})

const columns = [
  { title: '#', key: 'index', width: 60 },
  { title: 'Date', key: 'date', width: 150 },
  { title: 'Status', key: 'status', width: 150 },
  { title: 'Check In', key: 'check_in', width: 130 },
  { title: 'Check Out', key: 'check_out', width: 130 },
]

const formatTime = (time: string | null | undefined): string => {
  if (!time || time.trim() === '' || time === '00:00:00' || time === '00:00') return '—'

  let timeStr = time.trim()
  if (timeStr.length === 5) timeStr += ':00'

  const parts = timeStr.split(':')
  if (parts.length < 2) return '—'

  let hours = parseInt(parts[0], 10)
  let minutes = parts[1].substring(0, 2)

  if (isNaN(hours) || hours < 0 || hours > 23) return '—'
  if (isNaN(parseInt(minutes, 10))) return '—'

  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  hours = hours ? hours : 12

  return `${hours}:${minutes} ${ampm}`
}

const formatDate = (date: string | null | undefined): string => {
  if (!date || date.trim() === '') return '—'
  const parsed = dayjs(date.trim())
  return parsed.isValid() ? parsed.format('MMM D, YYYY') : '—'
}

const statusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'present': return 'green'
    case 'late': return 'orange'
    case 'absent': return 'red'
    case 'on_leave': return 'blue'
    case 'holiday': return 'purple'
    default: return 'default'
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (selectedMonth.value) params.month = selectedMonth.value
    if (selectedYear.value) params.year = selectedYear.value

    const [summaryRes, historyRes] = await Promise.all([
      api.get('/employee/attendance/summary', { params }),
      api.get('/employee/attendance/history', { params })
    ])

    summary.value = summaryRes.data

    const historyData = historyRes.data
    if (Array.isArray(historyData)) {
      history.value = historyData
    } else if (historyData?.data && Array.isArray(historyData.data)) {
      history.value = historyData.data
    } else if (historyData?.history && Array.isArray(historyData.history)) {
      history.value = historyData.history
    } else {
      history.value = []
      console.warn('Unexpected history response:', historyData)
    }
  } catch (err: any) {
    notification.error({ message: err.response?.data?.message || 'Failed to load attendance data' })
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
  filterOpen.value = false
}

const exportFile = async (format: 'pdf' | 'excel') => {
  const loadingRef = format === 'pdf' ? exportingPdf : exportingExcel
  loadingRef.value = true
  try {
    const params: any = {}
    if (selectedMonth.value) params.month = selectedMonth.value
    if (selectedYear.value) params.year = selectedYear.value

    const res = await api.get(`/employee/attendance/my/export/${format}`, { params, responseType: 'blob' })

    const blob = new Blob([res.data], {
      type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `my_attendance_${dayjs().format('YYYY-MM-DD')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    link.click()
    URL.revokeObjectURL(link.href)

    notification.success({ message: `${format.toUpperCase()} exported successfully` })
  } catch (err) {
    notification.error({ message: 'Export failed' })
  } finally {
    loadingRef.value = false
  }
}

const exportPdf = () => exportFile('pdf')
const exportExcel = () => exportFile('excel')

const form = reactive({
  dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  reason: '',
})

const resumeDate = computed(() => {
  if (!form.dateRange || !form.dateRange[1]) return null
  return form.dateRange[1].add(1, 'day').format('YYYY-MM-DD')
})

const disabledDate = (current: dayjs.Dayjs) => current.isBefore(dayjs().startOf('day'))

const handleCreate = async () => {
  if (!form.dateRange || form.reason.trim().length < 10) {
    notification.error({ message: 'Please complete all required fields' })
    return
  }

  createLoading.value = true
  try {
    await api.post('/leaves', {
      start_date: form.dateRange[0].format('YYYY-MM-DD'),
      end_date: form.dateRange[1].format('YYYY-MM-DD'),
      resume_date: resumeDate.value,
      reason: form.reason.trim(),
    })
    notification.success({ message: 'Leave request submitted successfully!' })
    showCreateModal.value = false
    form.dateRange = null
    form.reason = ''
    fetchData()
  } catch (err: any) {
    notification.error({ message: err.response?.data?.message || 'Failed to submit request' })
  } finally {
    createLoading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.attendance-table :deep(.ant-table-thead > tr > th) {
  background-color: #f8fafc !important;
  font-weight: 600;
  color: #475569;
}
</style>