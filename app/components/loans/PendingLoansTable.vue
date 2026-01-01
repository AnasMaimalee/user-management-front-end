<template>
  <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
    <div class="p-6 border-b border-slate-200 bg-slate-50">
      <h2 class="text-2xl font-semibold text-slate-800 mb-6">Pending Loan Requests</h2>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Employee Filter -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Employee</label>
          <a-select
            v-model:value="filterEmployee"
            placeholder="All employees"
            show-search
            :options="employeeOptions"
            style="width: 100%"
            allow-clear
          />
        </div>

        <!-- Department Filter -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Department</label>
          <a-select
            v-model:value="filterDepartment"
            placeholder="All departments"
            :options="departmentOptions"
            style="width: 100%"
            allow-clear
          />
        </div>

        <!-- Month Filter -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Month</label>
          <a-select v-model:value="filterMonth" placeholder="Month" style="width: 100%" allow-clear>
            <a-select-option v-for="(m, i) in months" :key="i + 1" :value="i + 1">
              {{ m }}
            </a-select-option>
          </a-select>
        </div>

        <!-- Year Filter -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Year</label>
          <a-select v-model:value="filterYear" placeholder="Year" style="width: 100%" allow-clear>
            <a-select-option v-for="y in years" :key="y" :value="y">{{ y }}</a-select-option>
          </a-select>
        </div>
      </div>

      <div class="flex flex-wrap justify-end gap-3 items-center">
        <a-button @click="resetFilters" icon="reload">
          Reset Filters
        </a-button>

        <a-button type="default" @click="fetchPending" icon="filter">
          Apply Filters
        </a-button>

        <a-divider type="vertical" v-if="pendingLoans.length > 0" class="hidden md:block" />

        <a-button
          v-if="pendingLoans.length > 0"
          type="default"
          danger
          @click="exportPDF"
          :loading="exportingPDF"
          icon="file-pdf"
        >
          Export PDF
        </a-button>

        <a-button
          v-if="pendingLoans.length > 0"
          type="default"
          @click="exportExcel"
          :loading="exportingExcel"
          icon="file-excel"
        >
          Export Excel
        </a-button>
      </div>
    </div>

    <a-table
      :columns="columns"
      :data-source="pendingLoans"
      row-key="id"
      :loading="loading"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'employee'">
          <div class="flex items-center gap-4 py-2">
            <a-avatar
              :size="48"
              class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl font-bold"
            >
              {{ record.employee.first_name.charAt(0) }}{{ record.employee.last_name.charAt(0) }}
            </a-avatar>
            <div>
              <p class="font-semibold text-slate-800 text-lg">
                {{ record.employee.first_name }} {{ record.employee.last_name }}
              </p>
              <p class="text-sm text-slate-500">{{ record.employee.employee_code }}</p>
            </div>
          </div>
        </template>

        <template v-else-if="column.key === 'amount'">
          <div>
            <p class="text-2xl font-bold text-indigo-600">
              ₦{{ Number(record.amount).toLocaleString() }}
            </p>
            <p class="text-sm text-slate-600 mt-1">
              {{ record.months }} months • ₦{{ Number(record.monthly_deduction).toLocaleString() }}/mo
            </p>
          </div>
        </template>

        <template v-else-if="column.key === 'reason'">
          <div>
            <p class="text-slate-700 line-clamp-3">{{ record.reason }}</p>
            <p class="text-xs text-slate-500 mt-3">
              Requested: {{ formatDate(record.created_at) }}
            </p>
          </div>
        </template>

        <template v-else-if="column.key === 'action'">
          <a-space :size="12">
            <a-button type="primary" size="large" @click="openModal(record, 'approve')">
              Approve
            </a-button>
            <a-button danger size="large" @click="openModal(record, 'reject')">
              Reject
            </a-button>
          </a-space>
        </template>
      </template>

      <template #emptyText>
        <div class="py-20 text-center">
          <div class="text-9xl text-green-100 mb-6">✓</div>
          <p class="text-3xl font-medium text-slate-700">No pending requests</p>
          <p class="text-lg text-slate-500 mt-3">All loan applications have been processed</p>
        </div>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import api from '~/utils/api'
import { message } from 'ant-design-vue'
import { ClockCircleOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  onProcess: (loan: any, action: 'approve' | 'reject') => void
}>()

const emit = defineEmits(['refresh'])

const loading = ref(false)
const exportingPDF = ref(false)
const exportingExcel = ref(false)

const pendingLoans = ref<any[]>([])
const employeeOptions = ref<any[]>([])
const departmentOptions = ref<any[]>([])

const filterEmployee = ref<string | null>(null)
const filterDepartment = ref<string | null>(null)
const filterMonth = ref<number | null>(null)
const filterYear = ref<number | null>(null)

const years = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 6 }, (_, i) => current - i)
})

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const columns = [
  { title: 'Employee', key: 'employee', width: 320 },
  { title: 'Amount & Terms', key: 'amount', width: 280 },
  { title: 'Reason & Date', key: 'reason', width: 420 },
  { title: 'Actions', key: 'action', width: 260, align: 'center' as const },
]

const formatDate = (date: string) => {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

const fetchFilters = async () => {
  try {
    const [empRes, deptRes] = await Promise.all([
      api.get('/employees'),
      api.get('/departments')
    ])

    employeeOptions.value = empRes.data.map((e: any) => ({
      value: e.id,
      label: `${e.first_name} ${e.last_name} (${e.employee_code})`
    }))

    departmentOptions.value = deptRes.data.map((d: any) => ({
      value: d.id,
      label: d.name
    }))
  } catch (err) {
    console.error('Failed to load filters')
  }
}
const fetchPending = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filterYear.value) params.year = filterYear.value
    if (filterMonth.value) params.month = filterMonth.value
    if (filterEmployee.value) params.employee_id = filterEmployee.value
    if (filterDepartment.value) params.department_id = filterDepartment.value

    // Now uses dedicated pending endpoint
    const res = await api.get('/loans/pending', { params })
    pendingLoans.value = res.data
  } catch (err: any) {
    message.error(err.response?.data?.message || 'Failed to load pending loans')
    pendingLoans.value = []
  } finally {
    loading.value = false
  }
}

defineExpose({ fetchPending })

const resetFilters = () => {
  filterEmployee.value = null
  filterDepartment.value = null
  filterMonth.value = null
  filterYear.value = null
  fetchPending()
}

const openModal = (loan: any, action: 'approve' | 'reject') => {
  props.onProcess(loan, action)
}

const exportPDF = async () => {
  exportingPDF.value = true
  try {
    const params: any = { format: 'pdf', status: 'pending' }
    if (filterYear.value) params.year = filterYear.value
    if (filterMonth.value) params.month = filterMonth.value
    if (filterEmployee.value) params.employee_id = filterEmployee.value
    if (filterDepartment.value) params.department_id = filterDepartment.value

    const res = await api.get('/loans/export/pdf', { params, responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Pending-Loans.pdf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('PDF exported successfully')
  } catch {
    message.error('PDF export failed')
  } finally {
    exportingPDF.value = false
  }
}

const exportExcel = async () => {
  exportingExcel.value = true
  try {
    const params: any = { format: 'excel', status: 'pending' }
    if (filterYear.value) params.year = filterYear.value
    if (filterMonth.value) params.month = filterMonth.value
    if (filterEmployee.value) params.employee_id = filterEmployee.value
    if (filterDepartment.value) params.department_id = filterDepartment.value

    const res = await api.get('/loans/export/excel', { params, responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'Pending-Loans.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('Excel exported successfully')
  } catch {
    message.error('Excel export failed')
  } finally {
    exportingExcel.value = false
  }
}

watch([filterEmployee, filterDepartment, filterMonth, filterYear], fetchPending)

onMounted(() => {
  fetchFilters()
  fetchPending()
})
</script>