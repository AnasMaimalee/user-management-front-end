<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Main Container - Full width & height -->
    <div class="max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header Section -->
      <div class="flex justify-between items-start mb-10">
        <div>
          <h1 class="text-4xl font-bold text-slate-800">My Loans</h1>
          <p class="text-lg text-slate-600 mt-3">Request and track your loan repayments</p>
        </div>
        <a-button 
          type="primary" 
          size="large" 
          class="px-8 py-6 text-lg"
          @click="showRequestModal = true"
        >
          Request New Loan
        </a-button>
      </div>

      <!-- Loans Table -->
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <a-table 
          :columns="columns" 
          :data-source="loans" 
          row-key="id"
          :pagination="{ pageSize: 10 }"
          class="min-h-96"
        >
          <template #emptyText>
            <div class="py-16 text-center">
              <p class="text-xl text-slate-500">No loans yet</p>
              <p class="text-slate-400 mt-2">Click "Request New Loan" to get started</p>
            </div>
          </template>

          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'amount'">
              <div>
                <p class="text-2xl font-bold text-indigo-600">
                  ₦{{ Number(record.amount).toLocaleString() }}
                </p>
                <p class="text-sm text-slate-500 mt-1">
                  Monthly: ₦{{ Number(record.monthly_deduction).toLocaleString() }}
                </p>
              </div>
            </template>

            <template v-if="column.key === 'progress'">
              <div class="space-y-2">
                <a-progress
                  :percent="Math.round((record.paid_amount / record.amount) * 100)"
                  :stroke-color="{ '0%': '#1677ff', '100%': '#52c41a' }"
                  :show-info="false"
                />
                <p class="text-xs text-center text-slate-600">
                  ₦{{ Number(record.paid_amount).toLocaleString() }} paid 
                  of ₦{{ Number(record.amount).toLocaleString() }}
                </p>
              </div>
            </template>

            <template v-if="column.key === 'status'">
              <a-tag :color="statusColor(record.status)" class="px-4 py-1 text-sm">
                {{ record.status.toUpperCase() }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </div>
    </div>

    <!-- Loan Request Modal -->
    <a-modal
      v-model:open="showRequestModal"
      title="Request New Loan"
      width="640px"
      :footer="null"
      destroy-on-close
    >
      <a-form layout="vertical" class="mt-4">
        <a-form-item label="Loan Amount (₦)" required>
          <a-input-number
            v-model:value="loanForm.amount"
            :min="10000"
            :max="5000000"
            :step="10000"
            placeholder="Enter amount"
            class="w-full"
            size="large"
            :formatter="value => value ? `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''"
            :parser="value => value ? value.replace(/\₦\s?|(,*)/g, '') : ''"
          />
        </a-form-item>

        <a-form-item label="Repayment Period (Months)" required>
          <a-input-number 
            v-model:value="loanForm.months" 
            :min="3" 
            :max="36" 
            class="w-full" 
            size="large"
            placeholder="e.g. 12"
          />
          <p class="text-sm text-slate-600 mt-3 font-medium">
            Monthly Deduction: 
            <span class="text-indigo-600">
              ₦{{ loanForm.amount && loanForm.months 
                ? Math.round(loanForm.amount / loanForm.months).toLocaleString() 
                : '0' }}
            </span>
          </p>
        </a-form-item>

        <a-form-item label="Reason for Loan" required>
          <a-textarea 
            v-model:value="loanForm.reason" 
            :rows="5" 
            placeholder="Explain why you need this loan..."
            size="large"
          />
        </a-form-item>

        <div class="flex justify-end gap-4 mt-8">
          <a-button @click="showRequestModal = false" size="large">
            Cancel
          </a-button>
          <a-button 
            type="primary" 
            size="large" 
            :loading="submitting" 
            @click="submitLoanRequest"
            class="px-8"
          >
            Submit Request
          </a-button>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

const loans = ref<any[]>([])
const showRequestModal = ref(false)
const submitting = ref(false)

const loanForm = ref({
  amount: null as number | null,
  months: null as number | null,
  reason: '',
})

const columns = [
  { title: 'Amount & Terms', key: 'amount', width: 280 },
  { title: 'Months', dataIndex: 'months', width: 120, align: 'center' as const },
  { title: 'Reason', dataIndex: 'reason', width: 300 },
  { title: 'Repayment Progress', key: 'progress', width: 300 },
  { title: 'Status', key: 'status', width: 140, align: 'center' as const },
]

const statusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'green'
    case 'rejected': return 'red'
    case 'completed': return 'blue'
    case 'pending': return 'orange'
    default: return 'default'
  }
}

const fetchLoans = async () => {
  try {
    const res = await api.get('/loans/my')
    loans.value = res.data
  } catch {
    notification.error({ message: 'Failed to load your loans' })
  }
}

const submitLoanRequest = async () => {
  if (!loanForm.value.amount || !loanForm.value.months || !loanForm.value.reason.trim()) {
    notification.error({ message: 'Please fill in all required fields' })
    return
  }

  submitting.value = true
  try {
    await api.post('/loans/request', loanForm.value)
    notification.success({ 
      message: 'Success!', 
      description: 'Your loan request has been submitted successfully.' 
    })
    showRequestModal.value = false
    loanForm.value = { amount: null, months: null, reason: '' }
    await fetchLoans()
  } catch (err: any) {
    notification.error({ 
      message: 'Request Failed', 
      description: err.response?.data?.message || 'Something went wrong. Please try again.' 
    })
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchLoans()
})
</script>

<style scoped>
/* Optional: Improve table header styling */
:deep(.ant-table-thead > tr > th) {
  background-color: #f8fafc !important;
  font-weight: 600;
  color: #374151;
}
</style>