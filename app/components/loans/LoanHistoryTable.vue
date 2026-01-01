<!-- components/loans/LoanHistoryTable.vue -->
<template>
  <div class="bg-white rounded-2xl shadow-lg overflow-hidden mt-12">
    <div class="p-6 border-b border-slate-200">
      <h2 class="text-xl font-semibold text-slate-800 mb-4">Loan History</h2>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- Employee Search -->
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

        <!-- Department -->
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

        <!-- Month -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Month</label>
          <a-select v-model:value="filterMonth" placeholder="Month" style="width: 100%" allow-clear>
            <a-select-option v-for="(m, i) in months" :key="i + 1" :value="i + 1">
              {{ m }}
            </a-select-option>
          </a-select>
        </div>

        <!-- Year -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Year</label>
          <a-select v-model:value="filterYear" placeholder="Year" style="width: 100%" allow-clear>
            <a-select-option v-for="y in years" :key="y" :value="y">{{ y }}</a-select-option>
          </a-select>
        </div>
      </div>

      <div class="mt-4 flex flex-wrap justify-end gap-3 items-center">
        <a-button 
            @click="resetFilters"
            icon="reload"
        >
            Reset Filters
        </a-button>

        <a-button 
            type="default" 
            @click="fetchHistory"
            icon="filter"
        >
            Apply Filters
        </a-button>

        <a-divider type="vertical" v-if="historyLoans.length > 0" class="hidden md:block" />

        <a-button 
            v-if="historyLoans.length > 0"
            type="default"
            @click="exportPDF"
            :loading="exportingPDF"
            icon="file-pdf"
            danger
        >
            Export PDF
        </a-button>

        <a-button 
            v-if="historyLoans.length > 0"
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
      :data-source="historyLoans"
      row-key="id"
      :loading="loading"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'employee'">
          <div class="flex items-center gap-3">
            <a-avatar :size="36" class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
              {{ record.employee.first_name.charAt(0) }}{{ record.employee.last_name.charAt(0) }}
            </a-avatar>
            <div>
              <p class="font-medium text-slate-800">
                {{ record.employee.first_name }} {{ record.employee.last_name }}
              </p>
              <p class="text-xs text-slate-500">{{ record.employee.employee_code }}</p>
            </div>
          </div>
        </template>

        <template v-else-if="column.key === 'amount'">
          <p class="text-xl font-bold text-indigo-600">
            ₦{{ Number(record.amount).toLocaleString() }}
          </p>
          <p class="text-sm text-slate-600">
            {{ record.months }} months • ₦{{ Number(record.monthly_deduction).toLocaleString() }}/mo
          </p>
        </template>

        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)">
            {{ record.status.toUpperCase() }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'department'">
          <span class="text-slate-700">{{ record.employee.department?.name || '—' }}</span>
        </template>
      </template>

      <template #emptyText>
        <div class="py-12 text-center">
          <p class="text-slate-500 text-lg">No loan history found</p>
          <p class="text-slate-400 mt-2">Try adjusting filters</p>
        </div>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import api from '~/utils/api'
import { message } from 'ant-design-vue'

const loading = ref(false)
const exportingPDF = ref(false)
const exportingExcel = ref(false)

const filterEmployee = ref<string | null>(null)
const filterDepartment = ref<string | null>(null)
const filterMonth = ref<number | null>(null)
const filterYear = ref<number | null>(new Date().getFullYear())

const historyLoans = ref<any[]>([])
const employeeOptions = ref<any[]>([])
const departmentOptions = ref<any[]>([])

const years = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => current - i)
})

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const columns = [
  { title: 'Employee', key: 'employee', width: 300 },
  { title: 'Department', key: 'department', width: 180 },
  { title: 'Amount & Terms', key: 'amount', width: 280 },
  { title: 'Status', key: 'status', width: 120 },
  { title: 'Reason', dataIndex: 'reason', width: 300 },
  { title: 'Processed', dataIndex: 'updated_at', width: 180 },
]

const statusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'green'
    case 'rejected': return 'red'
    case 'completed': return 'blue'
    default: return 'default'
  }
}

const resetFilters = () => {
  filterEmployee.value = null
  filterDepartment.value = null
  filterMonth.value = null
  filterYear.value = null
  fetchHistory()   // optional - watch will catch it anyway
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

const fetchHistory = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filterYear.value) params.year = filterYear.value
    if (filterMonth.value) params.month = filterMonth.value
    if (filterEmployee.value) params.employee_id = filterEmployee.value
    if (filterDepartment.value) params.department_id = filterDepartment.value

    const res = await api.get('/loans/history', { params })
    
    // Exclude pending loans — only show approved, rejected, completed
    historyLoans.value = res.data.filter((loan: any) => 
      loan.status !== 'pending'
    )
  } catch (err: any) {
    message.error(err.response?.data?.message || 'Failed to load history')
    historyLoans.value = []
  } finally {
    loading.value = false
  }
}

const exportPDF = async () => {
  exportingPDF.value = true
  try {
    const params: any = { format: 'pdf' }
    if (filterYear.value) params.year = filterYear.value
    if (filterMonth.value) params.month = filterMonth.value
    if (filterEmployee.value) params.employee_id = filterEmployee.value
    if (filterDepartment.value) params.department_id = filterDepartment.value

    const res = await api.get('/loans/export/pdf', { params, responseType: 'blob' })

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `loan-history-${filterMonth.value ? months[filterMonth.value - 1] : 'all'}-${filterYear.value || 'all'}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success('PDF exported successfully')
  } catch {
    message.error('Export failed')
  } finally {
    exportingPDF.value = false
  }
}

const exportExcel = async () => {
  exportingExcel.value = true
  try {
    const params: any = { format: 'excel' }
    if (filterYear.value) params.year = filterYear.value
    if (filterMonth.value) params.month = filterMonth.value
    if (filterEmployee.value) params.employee_id = filterEmployee.value
    if (filterDepartment.value) params.department_id = filterDepartment.value

    const res = await api.get('/loans/export/excel', { params, responseType: 'blob' })

    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `loan-history-${filterMonth.value ? months[filterMonth.value - 1] : 'all'}-${filterYear.value || 'all'}.xlsx`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success('Excel exported successfully')
  } catch {
    message.error('Export failed')
  } finally {
    exportingExcel.value = false
  }
}

watch([filterEmployee, filterDepartment, filterMonth, filterYear], fetchHistory)
onMounted(() => { fetchFilters(); fetchHistory(); })
onMounted(() => {
  fetchFilters()
  fetchHistory()
})
</script>