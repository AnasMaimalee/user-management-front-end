<template>
  <div class="min-h-screen bg-slate-50">
    <div class="w-full px-4 sm:px-6 lg:px-8 py-12">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-8 gap-6">
        <div>
          <h1 class="text-4xl font-bold text-slate-800">My Loans</h1>
          <p class="text-lg text-slate-600 mt-2">Request and track your loan repayments</p>
        </div>

        <div class="flex gap-4 flex-wrap">
          <a-button
            type="primary"
            size="large"
            class="px-10 py-6 text-lg"
            @click="showModal = true"
          >
            Request New Loan
          </a-button>

          <a-button
            v-if="loans.length > 0"
            type="default"
            danger
            size="large"
            @click="exportPDF"
            :loading="exportingPDF"
          >
            Export PDF
          </a-button>

          <a-button
            v-if="loans.length > 0"
            type="default"
            size="large"
            @click="exportExcel"
            :loading="exportingExcel"
          >
            Export Excel
          </a-button>
        </div>
      </div>

      <!-- Table with Filters in Header -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <!-- Header with Filters -->
        <div class="p-6 border-b border-slate-200 bg-slate-50">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 class="text-2xl font-bold text-slate-800">Loan History</h2>

            <!-- Compact Filters -->
            <div class="flex items-center gap-4">
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

              <a-button type="default" @click="resetFilters" class="text-slate-600">
                Reset
              </a-button>
            </div>
          </div>
        </div>

        <!-- Table -->
        <a-table
          :columns="columns"
          :data-source="filteredLoans"
          row-key="id"
          :pagination="{ pageSize: 10 }"
          :loading="loading"
          class="text-left"
        >
          <template #emptyText>
            <div class="py-24 text-center">
              <p class="text-2xl text-slate-600 font-medium">No loans found</p>
              <p class="text-lg text-slate-500 mt-3">Try adjusting filters or request a new loan</p>
            </div>
          </template>

          <template #bodyCell="{ column, record, index }">
            <!-- Numbering -->
            <template v-if="column.key === 'no'">
              <span class="text-slate-600 font-medium">{{ index + 1 }}</span>
            </template>

            <!-- Amount – Smaller + Ant Design Primary Color -->
            <template v-if="column.key === 'amount'">
              <div class="space-y-1">
                <p class="text-2xl font-bold" style="color: #1677ff;">
                  ₦{{ Number(record.amount).toLocaleString() }}
                </p>
                <p class="text-sm text-slate-600">
                  Monthly: ₦{{ Number(record.monthly_deduction || 0).toLocaleString() }}
                </p>
              </div>
            </template>

            <!-- Progress -->
            <template v-if="column.key === 'progress'">
              <div class="space-y-3">
                <a-progress
                  :percent="Math.round((record.paid_amount / record.amount) * 100)"
                  size="large"
                  :show-info="true"
                />
                <p class="text-center text-sm font-medium text-slate-700">
                  ₦{{ Number(record.paid_amount).toLocaleString() }} of ₦{{ Number(record.amount).toLocaleString() }}
                </p>
              </div>
            </template>

            <!-- Status -->
            <template v-if="column.key === 'status'">
              <a-tag :color="statusColor(record.status)" class="px-6 py-2 text-base font-semibold rounded-full">
                {{ record.status.toUpperCase() }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </div>
    </div>

    <!-- Loan Request Modal -->
    <a-modal
      v-model:open="showModal"
      title="Request New Loan"
      width="680px"
      centered
      :footer="null"
      destroy-on-close
    >
      <a-form layout="vertical" class="mt-4">
        <!-- Loan Amount – Text Input with ₦ on left -->
        <a-form-item label="Loan Amount (₦)" required>
          <a-input
            v-model:value="loanForm.amount"
            placeholder="e.g. 500000"
            size="large"
            class="w-full"
            addon-before="₦"
            @input="formatAmount"
          />
          <p class="text-xs text-slate-500 mt-2">
            Type only numbers. Commas will be added automatically.
          </p>
        </a-form-item>

        <!-- Repayment Period -->
        <a-form-item label="Repayment Period (Months)" required>
          <a-input-number
            v-model:value="loanForm.months"
            :min="3"
            :max="36"
            placeholder="e.g. 12"
            class="w-full"
            size="large"
          />
          <p class="text-sm text-slate-600 mt-3 font-medium">
            Estimated Monthly Deduction:
            <span class="text-indigo-600 font-bold text-xl">
              ₦{{ formattedMonthlyDeduction }}
            </span>
          </p>
        </a-form-item>

        <!-- Reason -->
        <a-form-item label="Reason for Loan" required>
          <a-textarea
            v-model:value="loanForm.reason"
            placeholder="Explain why you need this loan..."
            :rows="5"
            size="large"
            show-count
            :max-length="1000"
          />
        </a-form-item>

        <!-- Buttons -->
        <div class="flex justify-end gap-4 mt-10">
          <a-button size="large" @click="showModal = false">
            Cancel
          </a-button>
          <a-button
            type="primary"
            size="large"
            :loading="submitting"
            @click="submitLoanRequest"
            class="px-12"
          >
            Submit Request
          </a-button>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '~/utils/api'
import { notification, message } from 'ant-design-vue'

const loans = ref<any[]>([])
const loading = ref(false)
const showModal = ref(false)
const submitting = ref(false)
const exportingPDF = ref(false)
const exportingExcel = ref(false)

const loanForm = ref({
  amount: '' as string,
  months: null as number | null,
  reason: '',
})

// Filters
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

// Client-side filtered loans
const filteredLoans = computed(() => {
  if (!filterMonth.value && !filterYear.value) return loans.value

  return loans.value.filter(loan => {
    const date = new Date(loan.created_at)
    const month = date.getMonth() + 1
    const year = date.getFullYear()

    const matchMonth = !filterMonth.value || month === filterMonth.value
    const matchYear = !filterYear.value || year === filterYear.value

    return matchMonth && matchYear
  })
})

// Table columns with numbering
const columns = [
  { title: '#', key: 'no', width: 80, align: 'center' as const },
  { title: 'Amount & Terms', key: 'amount', width: 300 },
  { title: 'Duration', dataIndex: 'months', width: 130, align: 'center' as const },
  { title: 'Reason', dataIndex: 'reason', width: 400 },
  { title: 'Repayment Progress', key: 'progress', width: 380 },
  { title: 'Status', key: 'status', width: 160, align: 'center' as const },
]

const statusColor = (status: string): string => {
  const map: Record<string, string> = {
    approved: 'green',
    rejected: 'red',
    completed: 'blue',
    pending: 'orange',
  }
  return map[status] || 'default'
}

// Format amount with commas
const formatAmount = () => {
  let value = loanForm.value.amount.replace(/,/g, '')
  value = value.replace(/\D/g, '')
  loanForm.value.amount = value ? Number(value).toLocaleString() : ''
}

// Monthly deduction preview
const formattedMonthlyDeduction = computed(() => {
  if (!loanForm.value.amount || !loanForm.value.months) return '0'
  const clean = parseInt(loanForm.value.amount.replace(/,/g, ''), 10)
  return isNaN(clean) ? '0' : Math.round(clean / loanForm.value.months).toLocaleString()
})

// Apply filters (triggered on change)
const applyFilters = () => {
  // Client-side filtering is automatic via computed
}

// Reset filters
const resetFilters = () => {
  filterMonth.value = null
  filterYear.value = null
}

// Fetch loans
const fetchLoans = async () => {
  loading.value = true
  try {
    const res = await api.get('/loans/my')
    loans.value = res.data || []
  } catch {
    notification.error({ message: 'Failed to load loans' })
  } finally {
    loading.value = false
  }
}

// Submit loan request
const submitLoanRequest = async () => {
  if (!loanForm.value.amount || !loanForm.value.months || !loanForm.value.reason.trim()) {
    notification.error({ message: 'Please fill all required fields' })
    return
  }

  const amount = parseInt(loanForm.value.amount.replace(/,/g, ''), 10)
  if (isNaN(amount) || amount < 10000 || amount > 5000000) {
    notification.error({ message: 'Amount must be between ₦10,000 and ₦5,000,000' })
    return
  }

  submitting.value = true
  try {
    await api.post('/loans/request', {
      amount,
      months: loanForm.value.months,
      reason: loanForm.value.reason.trim(),
    })

    notification.success({
      message: 'Loan Request Submitted!',
      description: 'Your request has been sent for approval.',
    })

    showModal.value = false
    loanForm.value = { amount: '', months: null, reason: '' }
    await fetchLoans() // Refresh table
  } catch (err: any) {
    notification.error({
      message: 'Submission Failed',
      description: err.response?.data?.message || 'Please try again.'
    })
  } finally {
    submitting.value = false
  }
}

// Export PDF
const exportPDF = async () => {
  exportingPDF.value = true
  try {
    const params: any = {}
    if (filterMonth.value) params.month = filterMonth.value
    if (filterYear.value) params.year = filterYear.value

    const res = await api.get('/loans/my/export/pdf', { params, responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'My-Loans.pdf')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('PDF exported!')
  } catch {
    message.error('Export failed')
  } finally {
    exportingPDF.value = false
  }
}

// Export Excel
const exportExcel = async () => {
  exportingExcel.value = true
  try {
    const params: any = {}
    if (filterMonth.value) params.month = filterMonth.value
    if (filterYear.value) params.year = filterYear.value

    const res = await api.get('/loans/my/export/excel', { params, responseType: 'blob' })
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'My-Loans.xlsx')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    message.success('Excel exported!')
  } catch {
    message.error('Export failed')
  } finally {
    exportingExcel.value = false
  }
}

onMounted(() => {
  fetchLoans()
})
</script>

<style scoped>
:deep(.ant-table) {
  text-align: left;
}
:deep(.ant-table-thead > tr > th) {
  background-color: #f8fafc !important;
  font-weight: 600;
  color: #374151;
}
</style>