<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-slate-800">My Payslips</h1>
      <p class="text-slate-600 mt-2">View and download your monthly payslips</p>
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
      :data-source="payslips"
      row-key="id"
      bordered
      :loading="loading"
      class="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'period'">
          <div>
            <div class="font-medium">{{ months[record.month - 1] }} {{ record.year }}</div>
            <div class="text-xs text-slate-500">Net: ₦{{ Number(record.net_salary).toLocaleString() }}</div>
          </div>
        </template>

        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)">
            {{ statusText(record.status) }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'action'">
          <a-button
            type="primary"
            size="small"
            @click="downloadPayslip(record)"
            :loading="downloading === record.id"
          >
            <template #icon><download-outlined /></template>
            Download PDF
          </a-button>
        </template>
      </template>

      <template #emptyText>
        <div class="py-12 text-center">
          <p class="text-slate-500 text-lg">No payslips available yet.</p>
          <p class="text-slate-400 mt-2">Payslips will appear here after payroll is processed.</p>
        </div>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '~/utils/api'
import { message } from 'ant-design-vue'
import { DownloadOutlined } from '@ant-design/icons-vue'

const loading = ref(false)
const downloading = ref<string | null>(null)
const error = ref<string | null>(null)
const payslips = ref<any[]>([])

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const columns = [
  { title: 'Period', key: 'period', width: 200 },
  { title: 'Basic Salary', dataIndex: 'basic_salary', width: 150 },
  { title: 'Allowances', dataIndex: 'allowances', width: 150 },
  { title: 'Deductions', dataIndex: 'deductions', width: 150 },
  { title: 'Net Salary', dataIndex: 'net_salary', width: 180 },
  { title: 'Status', key: 'status', width: 120 },
  { title: 'Action', key: 'action', width: 150 },
]

const statusText = (status: string) => status.charAt(0).toUpperCase() + status.slice(1)

const statusColor = (status: string) => {
  switch (status) {
    case 'processed': return 'blue'
    case 'paid': return 'green'
    default: return 'default'
  }
}

const fetchPayslips = async () => {
  loading.value = true
  try {
    const res = await api.get('/payrolls/my')
    payslips.value = res.data
    error.value = null
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load payslips'
  } finally {
    loading.value = false
  }
}

const downloadPayslip = async (record: any) => {
  downloading.value = record.id
  try {
    const response = await api.get(`/payrolls/${record.id}/download`, {
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `payslip-${months[record.month - 1]}-${record.year}.pdf`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    message.success('Payslip downloaded successfully')
  } catch {
    message.error('Failed to download payslip')
  } finally {
    downloading.value = null
  }
}

onMounted(fetchPayslips)
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