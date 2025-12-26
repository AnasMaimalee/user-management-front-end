<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-slate-800">Payroll Management</h1>

      <a-button
        type="primary"
        size="large"
        :loading="running"
        @click="showRunModal = true"
      >
        <template #icon>
          <play-circle-outlined />
        </template>
        Run Payroll
      </a-button>
    </div>

    <!-- Year & Month Selector -->
    <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div class="flex flex-wrap gap-4 items-end">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Year</label>
          <a-select v-model:value="year" placeholder="Select year" style="width: 150px">
            <a-select-option v-for="y in years" :key="y" :value="y">{{ y }}</a-select-option>
          </a-select>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">Month</label>
          <a-select v-model:value="month" placeholder="Select month" style="width: 200px">
            <a-select-option v-for="(m, i) in months" :key="i + 1" :value="i + 1">
              {{ m }}
            </a-select-option>
          </a-select>
        </div>

        <a-button type="default" @click="fetchPayroll">
          <template #icon><search-outlined /></template>
          View Payroll
        </a-button>
      </div>
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
      :data-source="payrolls"
      row-key="id"
      bordered
      :loading="loading"
      class="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          <span class="text-slate-600 font-semibold">{{ index + 1 }}</span>
        </template>

        <template v-else-if="column.key === 'employee'">
          <div class="flex items-center gap-3">
            <a-avatar
              :size="36"
              class="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold"
            >
              {{ getInitials(record.employee) }}
            </a-avatar>
            <div>
              <div class="font-medium text-slate-800">
                {{ fullName(record.employee) }}
              </div>
              <div class="text-xs text-slate-500">{{ record.employee?.email }}</div>
            </div>
          </div>
        </template>

        <template v-else-if="column.key === 'net_salary'">
          <span class="font-bold text-green-600">₦{{ Number(record.net_salary).toLocaleString() }}</span>
        </template>

        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)">
            {{ statusText(record.status) }}
          </a-tag>
        </template>
      </template>

      <template #emptyText>
        <div class="py-12 text-center">
          <p class="text-slate-500 text-lg">No payroll records found for selected period.</p>
          <p class="text-slate-400 mt-2">Select a month and year to view payroll.</p>
        </div>
      </template>
    </a-table>

    <!-- Run Payroll Modal -->
    <a-modal
      v-model:open="showRunModal"
      title="Run Payroll"
      :confirm-loading="running"
      @ok="runPayroll"
      ok-text="Run Payroll Now"
      cancel-text="Cancel"
      width="500px"
    >
      <div class="space-y-4">
        <p class="text-slate-700">
          You are about to generate payroll for <strong>{{ months[month - 1] }} {{ year }}</strong>.
        </p>
        <p class="text-slate-600">
          This will calculate salaries for all employees and generate payslips.
        </p>
        <div class="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p class="text-amber-800 font-medium">Warning:</p>
          <p class="text-amber-700 text-sm mt-1">
            Running payroll again for the same month will overwrite existing records.
          </p>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '~/utils/api'
import { message } from 'ant-design-vue'
import {
  PlayCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue'

const loading = ref(false)
const running = ref(false)
const error = ref<string | null>(null)
const showRunModal = ref(false)

const year = ref(new Date().getFullYear())
const month = ref(new Date().getMonth() + 1)

const years = computed(() => {
  const current = new Date().getFullYear()
  return Array.from({ length: 5 }, (_, i) => current - i)
})

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const payrolls = ref<any[]>([])

const columns = [
  { title: '#', key: 'index', width: 70, fixed: 'left' },
  { title: 'Employee', key: 'employee', width: 320 },
  { title: 'Basic Salary', dataIndex: 'basic_salary', width: 150 },
  { title: 'Allowances', dataIndex: 'allowances', width: 150 },
  { title: 'Deductions', dataIndex: 'deductions', width: 150 },
  { title: 'Savings', dataIndex: 'savings_deduction', width: 150 },
  { title: 'Net Salary', key: 'net_salary', width: 180 },
  { title: 'Status', key: 'status', width: 120 },
]

const fullName = (employee: any) => {
  return employee ? `${employee.first_name} ${employee.last_name}` : '—'
}

const getInitials = (employee: any) => {
  if (!employee) return 'NA'
  return (employee.first_name?.[0] || '') + (employee.last_name?.[0] || '').toUpperCase()
}

const statusText = (status: string) => status.charAt(0).toUpperCase() + status.slice(1)

const statusColor = (status: string) => {
  switch (status) {
    case 'processed': return 'blue'
    case 'paid': return 'green'
    default: return 'default'
  }
}

const fetchPayroll = async () => {
  loading.value = true
  try {
    const res = await api.get('/payrolls', { params: { year: year.value, month: month.value } })
    payrolls.value = res.data
    error.value = null
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load payroll'
  } finally {
    loading.value = false
  }
}

const runPayroll = async () => {
  running.value = true
  try {
    await api.post('/payrolls/run', { year: year.value, month: month.value })
    message.success('Payroll run successfully! Payslips sent to employees.')
    showRunModal.value = false
    fetchPayroll()
  } catch (err: any) {
    message.error(err.response?.data?.message || 'Failed to run payroll')
  } finally {
    running.value = false
  }
}

onMounted(() => {
  fetchPayroll()
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