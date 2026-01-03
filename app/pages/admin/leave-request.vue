<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <h1 class="text-3xl font-bold text-slate-800 mb-8">Leave Requests</h1>

    <a-alert
      v-if="error"
      type="error"
      :message="error"
      show-icon
      closable
      class="mb-8"
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

        <!-- Filter Card (Collapsible) -->
        <a-collapse v-model:activeKey="pendingCollapseKey" class="mb-6">
          <a-collapse-panel key="1" header="" :show-arrow="false">
            <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
              <h3 class="text-lg font-semibold text-slate-800 mb-4">Filter Options</h3>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Employee</label>
                  <a-select
                    v-model:value="pendingFilters.employee"
                    placeholder="All employees"
                    :options="employeeOptions"
                    show-search
                    option-filter-prop="label"
                    allow-clear
                    class="w-full"
                    @change="applyFiltersAutomatically"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Department</label>
                  <a-select
                    v-model:value="pendingFilters.department"
                    placeholder="All departments"
                    :options="departmentOptions"
                    allow-clear
                    class="w-full"
                    @change="applyFiltersAutomatically"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Month</label>
                  <a-select
                    v-model:value="pendingFilters.month"
                    placeholder="All"
                    allow-clear
                    class="w-full"
                    @change="applyFiltersAutomatically"
                  >
                    <a-select-option :value="null">All</a-select-option>
                    <a-select-option v-for="m in 12" :key="m" :value="m">
                      {{ monthName(m) }}
                    </a-select-option>
                  </a-select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Year</label>
                  <a-select
                    v-model:value="pendingFilters.year"
                    placeholder="All"
                    allow-clear
                    class="w-full"
                    @change="applyFiltersAutomatically"
                  >
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

        <!-- Refresh + Export Buttons (always visible) -->
        <div class="flex justify-end gap-3 mt-6">
          <a-button type="default" @click="fetchLeaves" :loading="loading">
            <ReloadOutlined class="mr-2" />
            Refresh
          </a-button>

          <a-button
            v-if="filteredPendingLeaves.length"
            type="primary"
            danger
            @click="exportPendingPDF"
            :loading="exportingPendingPDF"
          >
            Export PDF
          </a-button>
          <a-button
            v-if="filteredPendingLeaves.length"
            type="primary"
            @click="exportPendingExcel"
            :loading="exportingPendingExcel"
          >
            Export Excel
          </a-button>
        </div>
      </div>

      <a-table
        :columns="pendingColumns"
        :data-source="filteredPendingLeaves"
        row-key="id"
        :loading="loading"
        bordered
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
          <template v-else-if="column.key === 'employee'">
            <div class="flex items-center gap-3">
              <a-avatar
                :size="40"
                class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold"
              >
                {{ getInitials(record.user?.employee) }}
              </a-avatar>
              <div>
                <div class="font-medium text-slate-800">{{ fullName(record.user?.employee) }}</div>
                <div class="text-xs text-slate-500">{{ record.user?.employee?.email || '—' }}</div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'dates'">
            <div>
              <div>{{ formatDate(record.start_date) }} → {{ formatDate(record.end_date) }}</div>
              <div class="text-xs text-slate-500 mt-1">Resume: {{ formatDate(record.resume_date) }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'reason'">
            <div>
              <span class="text-slate-600">{{ record.reason || '—' }}</span>
              <div class="text-xs text-slate-500 mt-2">Requested: {{ formatDate(record.created_at) }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-dropdown trigger="click" v-if="userStore.can('update leaves')">
              <a-button type="text" size="small">
                <EllipsisOutlined class="text-lg" />
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="openStatusModal(record, 'approved')">
                    <CheckCircleOutlined class="mr-2 text-green-600" /> Approve
                  </a-menu-item>
                  <a-menu-item @click="openStatusModal(record, 'rejected')">
                    <CloseCircleOutlined class="mr-2 text-red-600" /> Reject
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </template>

        <template #emptyText>
          <div class="py-16 text-center">
            <div class="text-8xl text-green-100 mb-4">✓</div>
            <p class="text-2xl font-medium text-slate-700">No pending requests</p>
            <p class="text-slate-500">All leave requests have been processed</p>
          </div>
        </template>
      </a-table>
    </div>

    <!-- History Section -->
    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div class="p-6 border-b border-slate-200 bg-slate-50">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold text-slate-800">History (Approved & Rejected)</h2>
          <a-button type="primary" @click="toggleHistoryFilters">
            <FilterOutlined class="mr-2" />
            {{ historyCollapseKey.length ? 'Hide Filters' : 'Show Filters' }}
          </a-button>
        </div>

        <a-collapse v-model:activeKey="historyCollapseKey" class="mb-6">
          <a-collapse-panel key="1" header="" :show-arrow="false">
            <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
              <h3 class="text-lg font-semibold text-slate-800 mb-4">Filter Options</h3>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Employee</label>
                  <a-select
                    v-model:value="historyFilters.employee"
                    placeholder="All employees"
                    :options="employeeOptions"
                    show-search
                    option-filter-prop="label"
                    allow-clear
                    class="w-full"
                    @change="applyFiltersAutomatically"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Department</label>
                  <a-select
                    v-model:value="historyFilters.department"
                    placeholder="All departments"
                    :options="departmentOptions"
                    allow-clear
                    class="w-full"
                    @change="applyFiltersAutomatically"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Month</label>
                  <a-select
                    v-model:value="historyFilters.month"
                    placeholder="All"
                    allow-clear
                    class="w-full"
                    @change="applyFiltersAutomatically"
                  >
                    <a-select-option :value="null">All</a-select-option>
                    <a-select-option v-for="m in 12" :key="m" :value="m">
                      {{ monthName(m) }}
                    </a-select-option>
                  </a-select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-slate-700 mb-2">Year</label>
                  <a-select
                    v-model:value="historyFilters.year"
                    placeholder="All"
                    allow-clear
                    class="w-full"
                    @change="applyFiltersAutomatically"
                  >
                    <a-select-option :value="null">All</a-select-option>
                    <a-select-option v-for="y in years" :key="y" :value="y">{{ y }}</a-select-option>
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
          <a-button type="default" @click="fetchLeaves" :loading="loading">
            <ReloadOutlined class="mr-2" />
            Refresh
          </a-button>

          <a-button
            v-if="filteredHistoryLeaves.length"
            type="primary"
            danger
            @click="exportHistoryPDF"
            :loading="exportingHistoryPDF"
          >
            Export PDF
          </a-button>
          <a-button
            v-if="filteredHistoryLeaves.length"
            type="primary"
            @click="exportHistoryExcel"
            :loading="exportingHistoryExcel"
          >
            Export Excel
          </a-button>
        </div>
      </div>

      <a-table
        :columns="historyColumns"
        :data-source="filteredHistoryLeaves"
        row-key="id"
        :loading="loading"
        bordered
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
          <template v-else-if="column.key === 'employee'">
            <div class="flex items-center gap-3">
              <a-avatar
                :size="40"
                class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold"
              >
                {{ getInitials(record.user?.employee) }}
              </a-avatar>
              <div>
                <div class="font-medium text-slate-800">{{ fullName(record.user?.employee) }}</div>
                <div class="text-xs text-slate-500">{{ record.user?.employee?.email || '—' }}</div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'dates'">
            <div>
              <div>{{ formatDate(record.start_date) }} → {{ formatDate(record.end_date) }}</div>
              <div class="text-xs text-slate-500 mt-1">Resume: {{ formatDate(record.resume_date) }}</div>
            </div>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="statusColor(record.status)">
              {{ statusText(record.status) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'reason'">
            <div>
              <span class="text-slate-600">{{ record.reason || '—' }}</span>
              <div class="text-xs text-slate-500 mt-2">Processed: {{ formatDate(record.updated_at) }}</div>
            </div>
          </template>
        </template>

        <template #emptyText>
          <div class="py-16 text-center">
            <div class="text-8xl text-slate-100 mb-4">📋</div>
            <p class="text-2xl font-medium text-slate-700">No history found</p>
            <p class="text-slate-500">Try adjusting the filters</p>
          </div>
        </template>
      </a-table>
    </div>

    <!-- Approve/Reject Modal -->
    <a-modal
      v-model:open="statusModal.visible"
      :title="modalTitle"
      :confirm-loading="statusModal.loading"
      @ok="handleStatusUpdate"
      ok-text="Confirm"
      cancel-text="Cancel"
      width="640px"
      :ok-button-props="okButtonProps"
    >
      <div class="space-y-7 py-4">
        <div class="flex items-center gap-5">
          <a-avatar
            :size="72"
            class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-3xl font-bold shadow-2xl"
          >
            {{ getInitials(statusModal.record?.user?.employee) }}
          </a-avatar>
          <div>
            <h3 class="text-2xl font-bold text-slate-800">
              {{ fullName(statusModal.record?.user?.employee) }}
            </h3>
            <p class="text-base text-slate-600">{{ statusModal.record?.user?.employee?.email || '—' }}</p>
          </div>
        </div>

        <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div class="bg-white rounded-xl py-5 shadow-sm">
              <p class="text-sm font-semibold text-slate-600 uppercase tracking-wider">Start Date</p>
              <p class="text-2xl font-bold text-slate-800 mt-3">
                {{ formatDate(statusModal.record?.start_date) }}
              </p>
            </div>
            <div class="bg-white rounded-xl py-5 shadow-sm">
              <p class="text-sm font-semibold text-slate-600 uppercase tracking-wider">End Date</p>
              <p class="text-2xl font-bold text-slate-800 mt-3">
                {{ formatDate(statusModal.record?.end_date) }}
              </p>
            </div>
            <div class="bg-green-50 rounded-xl py-6 shadow-md border-2 border-green-300">
              <p class="text-sm font-bold text-green-700 uppercase tracking-wider">Resume Date</p>
              <p class="text-3xl font-extrabold text-green-800 mt-4">
                {{ formatDate(statusModal.record?.resume_date) }}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p class="text-base font-semibold text-slate-700 mb-3">Reason for Leave</p>
          <div class="bg-slate-50 rounded-2xl p-6 border border-slate-200 min-h-36">
            <p class="text-slate-700 text-base leading-relaxed">
              {{ statusModal.record?.reason || 'No reason provided.' }}
            </p>
          </div>
        </div>

        <div>
          <p class="text-base font-semibold text-slate-700 mb-2">{{ noteLabel }}</p>
          <a-textarea
            v-model:value="statusModal.note"
            :rows="5"
            :placeholder="notePlaceholder"
            class="rounded-xl"
            show-count
            :maxlength="255"
          />
          <p v-if="noteError" class="text-red-600 text-sm mt-2">{{ noteError }}</p>
          <p v-else class="text-slate-500 text-sm mt-2">{{ noteHelp }}</p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'
import { useUserStore } from '~/stores/user'
import {
  EllipsisOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons-vue'

const userStore = useUserStore()
await userStore.fetchUser()

const allLeaves = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const pendingFilters = reactive({ employee: null, department: null, month: null as number | null, year: null as number | null })
const historyFilters = reactive({ employee: null, department: null, month: null as number | null, year: null as number | null })

// Collapse state
const pendingCollapseKey = ref<string[]>([])
const historyCollapseKey = ref<string[]>([])

const togglePendingFilters = () => {
  pendingCollapseKey.value = pendingCollapseKey.value.length ? [] : ['1']
}
const toggleHistoryFilters = () => {
  historyCollapseKey.value = historyCollapseKey.value.length ? [] : ['1']
}

const employeeOptions = ref<any[]>([])
const departmentOptions = ref<any[]>([])

const exportingPendingPDF = ref(false)
const exportingPendingExcel = ref(false)
const exportingHistoryPDF = ref(false)
const exportingHistoryExcel = ref(false)

const currentYear = dayjs().year()
const years = Array.from({ length: 6 }, (_, i) => currentYear - i)

const monthName = (m: number): string => {
  return dayjs().month(m - 1).format('MMMM')
}

const filteredPendingLeaves = computed(() => {
  return allLeaves.value
    .filter(l => l.status === 'pending')
    .filter(leave => {
      const emp = leave.user?.employee
      if (pendingFilters.employee && emp?.id !== pendingFilters.employee) return false
      if (pendingFilters.department && emp?.department?.id !== pendingFilters.department) return false
      if (pendingFilters.month && (dayjs(leave.start_date).month() + 1) !== pendingFilters.month) return false
      if (pendingFilters.year && dayjs(leave.start_date).year() !== pendingFilters.year) return false
      return true
    })
})

const filteredHistoryLeaves = computed(() => {
  return allLeaves.value
    .filter(l => ['approved', 'rejected'].includes(l.status))
    .filter(leave => {
      const emp = leave.user?.employee
      if (historyFilters.employee && emp?.id !== historyFilters.employee) return false
      if (historyFilters.department && emp?.department?.id !== historyFilters.department) return false
      if (historyFilters.month && (dayjs(leave.start_date).month() + 1) !== historyFilters.month) return false
      if (historyFilters.year && dayjs(leave.start_date).year() !== historyFilters.year) return false
      return true
    })
})

const pendingColumns = [
  { title: '#', key: 'index', width: 60 },
  { title: 'Employee', key: 'employee', width: 280 },
  { title: 'Dates', key: 'dates', width: 240 },
  { title: 'Reason', key: 'reason', width: 400 },
  { title: 'Actions', key: 'actions', width: 100, align: 'center' },
]

const historyColumns = [
  { title: '#', key: 'index', width: 60 },
  { title: 'Employee', key: 'employee', width: 280 },
  { title: 'Dates', key: 'dates', width: 240 },
  { title: 'Status', key: 'status', width: 120, align: 'center' },
  { title: 'Reason', key: 'reason', width: 400 },
]

const statusModal = reactive({
  visible: false,
  loading: false,
  action: '' as 'approved' | 'rejected' | '',
  record: null as any,
  note: '',
})
const noteError = ref('')

const modalTitle = computed(() => statusModal.action === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request')
const okButtonProps = computed(() => ({ danger: statusModal.action === 'rejected' }))
const noteLabel = computed(() => statusModal.action === 'rejected' ? 'Admin Note (Required)' : 'Admin Note (Optional)')
const noteHelp = computed(() => statusModal.action === 'rejected' ? 'Minimum 10 characters required' : 'Optional note')
const notePlaceholder = computed(() => statusModal.action === 'rejected' ? 'Explain the rejection...' : 'Optional message...')

const fullName = (e: any) => e ? `${e.first_name || ''} ${e.last_name || ''}`.trim() : 'Unknown'
const getInitials = (e: any) => e ? `${e.first_name?.[0] || ''}${e.last_name?.[0] || ''}`.toUpperCase() : 'NA'
const formatDate = (d: string | null) => d ? dayjs(d).format('MMM D, YYYY') : '—'
const statusText = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'
const statusColor = (s: string) => s === 'approved' ? 'green' : s === 'rejected' ? 'volcano' : 'orange'

const fetchLeaves = async () => {
  loading.value = true
  try {
    const res = await api.get('/leaves')
    allLeaves.value = Array.isArray(res.data) ? res.data : res.data?.data || []
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load leaves'
    notification.error({ message: error.value })
  } finally {
    loading.value = false
  }
}

const fetchFilterOptions = async () => {
  try {
    const [empRes, deptRes] = await Promise.all([
      api.get('/employees?limit=1000'),
      api.get('/departments')
    ])

    const employeesData = empRes.data?.data || empRes.data || []
    employeeOptions.value = employeesData.map((e: any) => ({
      value: e.id,
      label: `${e.first_name} ${e.last_name} (${e.employee_code || e.email || 'No code'})`,
    }))

    const departmentsData = Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.data || []
    departmentOptions.value = departmentsData.map((d: any) => ({
      value: d.id,
      label: d.name || 'Unnamed',
    }))
  } catch (err: any) {
    notification.error({ message: 'Failed to load employees or departments' })
  }
}

const applyFiltersAutomatically = () => {
  // Computed properties update automatically
}

const resetPendingFilters = () => {
  pendingFilters.employee = null
  pendingFilters.department = null
  pendingFilters.month = null
  pendingFilters.year = null
}

const resetHistoryFilters = () => {
  historyFilters.employee = null
  historyFilters.department = null
  historyFilters.month = null
  historyFilters.year = null
}

const exportFile = async (type: 'pending' | 'history', format: 'pdf' | 'excel', filters: any, loadingRef: any) => {
  loadingRef.value = true
  try {
    const params = new URLSearchParams()
    if (filters.year) params.append('year', filters.year.toString())
    if (filters.month) params.append('month', filters.month.toString())
    if (filters.employee) params.append('employee', filters.employee)
    if (filters.department) params.append('department', filters.department)

    const url = `/leaves/export-${format}/${type}${params.toString() ? '?' + params.toString() : ''}`

    const response = await api.get(url, { 
      responseType: 'blob',
      headers: {
        'Accept': format === 'excel' 
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'application/pdf'
      }
    })

    const contentType = format === 'pdf' 
      ? 'application/pdf' 
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    const blob = new Blob([response.data], { type: contentType })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `leave_requests_${type}_${dayjs().format('YYYY-MM-DD')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    link.click()
    URL.revokeObjectURL(link.href)

    notification.success({ message: `${format.toUpperCase()} downloaded successfully` })
  } catch (err) {
    notification.error({ message: 'Export failed' })
  } finally {
    loadingRef.value = false
  }
}

const exportPendingPDF = () => exportFile('pending', 'pdf', pendingFilters, exportingPendingPDF)
const exportPendingExcel = () => exportFile('pending', 'excel', pendingFilters, exportingPendingExcel)
const exportHistoryPDF = () => exportFile('history', 'pdf', historyFilters, exportingHistoryPDF)
const exportHistoryExcel = () => exportFile('history', 'excel', historyFilters, exportingHistoryExcel)

const openStatusModal = (record: any, action: 'approved' | 'rejected') => {
  statusModal.record = record
  statusModal.action = action
  statusModal.note = ''
  noteError.value = ''
  statusModal.visible = true
}

const handleStatusUpdate = async () => {
  if (!statusModal.record || !statusModal.action) return

  if (statusModal.action === 'rejected') {
    if (!statusModal.note.trim()) {
      noteError.value = 'Admin note is required when rejecting.'
      return
    }
    if (statusModal.note.trim().length < 10) {
      noteError.value = 'Admin note must be at least 10 characters.'
      return
    }
  }

  statusModal.loading = true
  try {
    await api.patch(`/leaves/${statusModal.record.id}`, {
      status: statusModal.action,
      admin_note: statusModal.note.trim() || null,
    })

    notification.success({ message: `Leave request ${statusModal.action} successfully.` })
    statusModal.visible = false
    await fetchLeaves()
  } catch (err: any) {
    notification.error({ message: err.response?.data?.message || 'Failed to update status' })
  } finally {
    statusModal.loading = false
  }
}

onMounted(() => {
  fetchFilterOptions()
  fetchLeaves()
})
</script>