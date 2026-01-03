<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-slate-800">My Leave Requests</h1>

      <a-button type="primary" size="large" @click="showCreateModal = true">
        <template #icon>
          <PlusOutlined />
        </template>
        Request Leave
      </a-button>
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

    <!-- Pending Requests -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
      <div class="p-6 border-b border-slate-200 bg-slate-50">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold text-slate-800">Pending Requests</h2>
          <a-button type="primary" @click="togglePendingFilters">
            <FilterOutlined class="mr-2" />
            {{ pendingCollapseKey.length ? 'Hide Filters' : 'Show Filters' }}
          </a-button>
        </div>

        <a-collapse v-model:activeKey="pendingCollapseKey" class="mb-6">
          <a-collapse-panel key="1" header="" :show-arrow="false">
            <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
              <h3 class="text-lg font-semibold text-slate-800 mb-4">Filter My Pending Requests</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Month</label>
                  <a-select v-model:value="pendingFilters.month" placeholder="All" allow-clear class="w-full">
                    <a-select-option :value="null">All</a-select-option>
                    <a-select-option v-for="m in 12" :key="m" :value="m">
                      {{ monthName(m) }}
                    </a-select-option>
                  </a-select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Year</label>
                  <a-select v-model:value="pendingFilters.year" placeholder="All" allow-clear class="w-full">
                    <a-select-option :value="null">All</a-select-option>
                    <a-select-option v-for="y in years" :key="y" :value="y">{{ y }}</a-select-option>
                  </a-select>
                </div>
              </div>
              <div class="mt-6 flex justify-end">
                <a-button @click="resetPendingFilters">Reset Filters</a-button>
              </div>
            </div>
          </a-collapse-panel>
        </a-collapse>

        <div class="flex justify-end gap-3 mt-6">
          <a-button type="default" @click="fetchMyLeaves" :loading="loading">
            <ReloadOutlined class="mr-2" />
            Refresh
          </a-button>

          <a-button
            v-if="filteredPending.length"
            type="primary"
            danger
            @click="exportMyPDF('pending')"
            :loading="exportingPDF"
          >
            Export PDF
          </a-button>
          <a-button
            v-if="filteredPending.length"
            type="primary"
            @click="exportMyExcel('pending')"
            :loading="exportingExcel"
          >
            Export Excel
          </a-button>
        </div>
      </div>

      <a-table
        :columns="pendingColumns"
        :data-source="filteredPending"
        row-key="id"
        :loading="loading"
        bordered
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
          <template v-else-if="column.key === 'dates'">
            <div>
              <div>{{ formatDate(record.start_date) }} → {{ formatDate(record.end_date) }}</div>
              <div class="text-xs text-slate-500 mt-1">Resume: {{ formatDate(record.resume_date) }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'reason'">
            <span class="text-slate-600">{{ record.reason || '—' }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">
              {{ statusText(record.status) }}
            </a-tag>
          </template>
        </template>

        <template #emptyText>
          <div class="py-16 text-center">
            <div class="text-8xl text-green-100 mb-4">✓</div>
            <p class="text-2xl font-medium text-slate-700">No pending requests</p>
            <p class="text-slate-500">You're all caught up!</p>
          </div>
        </template>
      </a-table>
    </div>

    <!-- History Section -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div class="p-6 border-b border-slate-200 bg-slate-50">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold text-slate-800">Leave History</h2>
          <a-button type="primary" @click="toggleHistoryFilters">
            <FilterOutlined class="mr-2" />
            {{ historyCollapseKey.length ? 'Hide Filters' : 'Show Filters' }}
          </a-button>
        </div>

        <a-collapse v-model:activeKey="historyCollapseKey" class="mb-6">
          <a-collapse-panel key="1" header="" :show-arrow="false">
            <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
              <h3 class="text-lg font-semibold text-slate-800 mb-4">Filter My History</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Month</label>
                  <a-select v-model:value="historyFilters.month" placeholder="All" allow-clear class="w-full">
                    <a-select-option :value="null">All</a-select-option>
                    <a-select-option v-for="m in 12" :key="m" :value="m">
                      {{ monthName(m) }}
                    </a-select-option>
                  </a-select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Year</label>
                  <a-select v-model:value="historyFilters.year" placeholder="All" allow-clear class="w-full">
                    <a-select-option :value="null">All</a-select-option>
                    <a-select-option v-for="y in years" :key="y" :value="y">{{ y }}</a-select-option>
                  </a-select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <a-select v-model:value="historyFilters.status" placeholder="All" allow-clear class="w-full">
                    <a-select-option :value="null">All</a-select-option>
                    <a-select-option value="approved">Approved</a-select-option>
                    <a-select-option value="rejected">Rejected</a-select-option>
                  </a-select>
                </div>
              </div>
              <div class="mt-6 flex justify-end">
                <a-button @click="resetHistoryFilters">Reset Filters</a-button>
              </div>
            </div>
          </a-collapse-panel>
        </a-collapse>

        <div class="flex justify-end gap-3 mt-6">
          <a-button type="default" @click="fetchMyLeaves" :loading="loading">
            <ReloadOutlined class="mr-2" />
            Refresh
          </a-button>

          <a-button
            v-if="filteredHistory.length"
            type="primary"
            danger
            @click="exportMyPDF('history')"
            :loading="exportingPDF"
          >
            Export PDF
          </a-button>
          <a-button
            v-if="filteredHistory.length"
            type="primary"
            @click="exportMyExcel('history')"
            :loading="exportingExcel"
          >
            Export Excel
          </a-button>
        </div>
      </div>

      <a-table
        :columns="historyColumns"
        :data-source="filteredHistory"
        row-key="id"
        :loading="loading"
        bordered
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
          <template v-else-if="column.key === 'dates'">
            <div>
              <div>{{ formatDate(record.start_date) }} → {{ formatDate(record.end_date) }}</div>
              <div class="text-xs text-slate-500 mt-1">Resume: {{ formatDate(record.resume_date) }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'reason'">
            <span class="text-slate-600">{{ record.reason || '—' }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">
              {{ statusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'admin_note'">
            <div v-if="record.admin_note" class="text-sm text-slate-700 max-w-md">
              <p class="italic leading-relaxed">{{ record.admin_note }}</p>
            </div>
            <span v-else class="text-slate-400 text-sm">—</span>
          </template>
        </template>

        <template #emptyText>
          <div class="py-16 text-center">
            <div class="text-8xl text-slate-100 mb-4">📋</div>
            <p class="text-2xl font-medium text-slate-700">No leave history yet</p>
            <p class="text-slate-500">Your approved/rejected requests will appear here.</p>
          </div>
        </template>
      </a-table>
    </div>

    <!-- Create Leave Modal -->
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
        <a-form-item
          label="Leave Dates"
          :rules="[{ required: true, message: 'Please select start and end date' }]"
        >
          <a-range-picker
            v-model:value="form.dateRange"
            :placeholder="['Start Date', 'End Date']"
            class="w-full"
            :disabled-date="disabledDate"
            format="MMM D, YYYY"
          />
        </a-form-item>

        <a-form-item
          label="Reason"
          :rules="[
            { required: true, message: 'Please provide a reason' },
            { min: 10, message: 'Reason must be at least 10 characters' }
          ]"
        >
          <a-textarea
            v-model:value="form.reason"
            placeholder="Explain why you need this leave..."
            :rows="4"
            :maxlength="255"
            show-count
          />
        </a-form-item>

        <div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p class="text-sm text-blue-800 font-medium">
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
import {
  PlusOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'

const leaves = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const createLoading = ref(false)
const showCreateModal = ref(false)
const exportingPDF = ref(false)
const exportingExcel = ref(false)

const form = reactive({
  dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  reason: '',
})

const pendingFilters = reactive({ month: null as number | null, year: null as number | null })
const historyFilters = reactive({ month: null as number | null, year: null as number | null, status: null as string | null })

const pendingCollapseKey = ref<string[]>([])
const historyCollapseKey = ref<string[]>([])

const togglePendingFilters = () => {
  pendingCollapseKey.value = pendingCollapseKey.value.length ? [] : ['1']
}
const toggleHistoryFilters = () => {
  historyCollapseKey.value = historyCollapseKey.value.length ? [] : ['1']
}

const currentYear = dayjs().year()
const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

const monthName = (m: number): string => dayjs().month(m - 1).format('MMMM')

const filteredPending = computed(() => {
  return leaves.value
    .filter(l => l.status === 'pending')
    .filter(l => {
      if (pendingFilters.month && (dayjs(l.start_date).month() + 1) !== pendingFilters.month) return false
      if (pendingFilters.year && dayjs(l.start_date).year() !== pendingFilters.year) return false
      return true
    })
})

const filteredHistory = computed(() => {
  return leaves.value
    .filter(l => ['approved', 'rejected'].includes(l.status))
    .filter(l => {
      if (historyFilters.month && (dayjs(l.start_date).month() + 1) !== historyFilters.month) return false
      if (historyFilters.year && dayjs(l.start_date).year() !== historyFilters.year) return false
      if (historyFilters.status && l.status !== historyFilters.status) return false
      return true
    })
})

const pendingColumns = [
  { title: '#', key: 'index', width: 70 },
  { title: 'Dates', key: 'dates', width: 280 },
  { title: 'Reason', key: 'reason' },
  { title: 'Status', key: 'status', width: 140 },
]

const historyColumns = [
  { title: '#', key: 'index', width: 70 },
  { title: 'Dates', key: 'dates', width: 280 },
  { title: 'Reason', key: 'reason' },
  { title: 'Status', key: 'status', width: 140 },
  { title: 'Admin Note', key: 'admin_note', width: 350 },
]

const resumeDate = computed(() => {
  if (!form.dateRange || !form.dateRange[1]) return null
  return form.dateRange[1].add(1, 'day').format('YYYY-MM-DD')
})

const disabledDate = (current: dayjs.Dayjs) => {
  return current && current < dayjs().startOf('day')
}

const formatDate = (date: string | null) => {
  return date ? dayjs(date).format('MMM D, YYYY') : '—'
}

const statusText = (status: string) => status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'
const statusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'green'
    case 'rejected': return 'volcano'
    case 'pending': return 'orange'
    default: return 'default'
  }
}

const fetchMyLeaves = async () => {
  loading.value = true
  try {
    const res = await api.get('/leaves/my')
    leaves.value = Array.isArray(res.data) ? res.data : res.data?.data || []
    error.value = null
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load your leave requests'
    notification.error({ message: error.value })
  } finally {
    loading.value = false
  }
}

const exportMyFile = async (type: 'pending' | 'history', format: 'pdf' | 'excel') => {
  const loadingRef = format === 'pdf' ? exportingPDF : exportingExcel
  loadingRef.value = true
  try {
    const params = new URLSearchParams()
    const filters = type === 'pending' ? pendingFilters : historyFilters
    if (filters.year) params.append('year', filters.year.toString())
    if (filters.month) params.append('month', filters.month.toString())
    if (type === 'history' && historyFilters.status) params.append('status', historyFilters.status)

    const url = `/leaves/my/export-${format}/${type}${params.toString() ? '?' + params.toString() : ''}`

    const response = await api.get(url, { responseType: 'blob' })

    const blob = new Blob([response.data], {
      type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `my_leave_requests_${type}_${dayjs().format('YYYY-MM-DD')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    link.click()
    URL.revokeObjectURL(link.href)

    notification.success({ message: `${format.toUpperCase()} exported successfully` })
  } catch (err) {
    notification.error({ message: 'Export failed' })
  } finally {
    loadingRef.value = false
  }
}

const exportMyPDF = (type: 'pending' | 'history') => exportMyFile(type, 'pdf')
const exportMyExcel = (type: 'pending' | 'history') => exportMyFile(type, 'excel')

const handleCreate = async () => {
  if (!form.dateRange || form.reason.trim().length < 10) {
    notification.error({ message: 'Please fill all fields correctly' })
    return
  }

  createLoading.value = true
  try {
    await api.post('/leaves', {
      start_date: form.dateRange[0].format('YYYY-MM-DD'),
      end_date: form.dateRange[1].format('YYYY-MM-DD'),
      resume_date: form.dateRange[1].add(1, 'day').format('YYYY-MM-DD'),
      reason: form.reason.trim(),
    })

    notification.success({ message: 'Leave request submitted!' })
    showCreateModal.value = false
    Object.assign(form, { dateRange: null, reason: '' })
    await fetchMyLeaves()
  } catch (err: any) {
    notification.error({ message: err.response?.data?.message || 'Submission failed' })
  } finally {
    createLoading.value = false
  }
}

const resetPendingFilters = () => {
  pendingFilters.month = null
  pendingFilters.year = null
}

const resetHistoryFilters = () => {
  historyFilters.month = null
  historyFilters.year = null
  historyFilters.status = null
}

onMounted(fetchMyLeaves)
</script>