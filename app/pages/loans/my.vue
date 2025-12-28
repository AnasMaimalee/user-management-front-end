<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">My Loans</h1>
        <p class="text-slate-600 mt-2">Request and track loan repayments</p>
      </div>
      <a-button type="primary" size="large" @click="showRequestModal = true">
        Request New Loan
      </a-button>
    </div>

    <a-table :columns="columns" :data-source="loans" row-key="id" class="bg-white rounded-xl shadow">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'amount'">
          <p class="text-2xl font-bold text-primary">₦{{ Number(record.amount).toLocaleString() }}</p>
          <p class="text-sm text-slate-500">Monthly: ₦{{ Number(record.monthly_deduction).toLocaleString() }}</p>
        </template>
        <template v-if="column.key === 'progress'">
          <a-progress
            :percent="Math.round((record.paid_amount / record.amount) * 100)"
            :stroke-color="{ '0%': '#1677ff', '100%': '#52c41a' }"
          />
          <p class="text-xs text-center mt-2">
            ₦{{ Number(record.paid_amount).toLocaleString() }} paid
          </p>
        </template>
        <template v-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)">
            {{ record.status.toUpperCase() }}
          </a-tag>
        </template>
      </template>
    </a-table>

    <!-- Loan Request Modal -->
    <a-modal v-model:open="showRequestModal" title="Request Loan" width="600px">
      <a-form layout="vertical">
        <a-form-item label="Loan Amount (₦)" required>
          <a-input-number
            v-model:value="loanForm.amount"
            :min="10000"
            :max="5000000"
            :formatter="value => value ? `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''"
            class="w-full"
            size="large"
          />
        </a-form-item>

        <a-form-item label="Repayment Period (Months)" required>
          <a-input-number v-model:value="loanForm.months" :min="3" :max="36" class="w-full" size="large" />
          <p class="text-xs text-slate-500 mt-2">
            Monthly deduction: ₦{{ loanForm.amount && loanForm.months ? (loanForm.amount / loanForm.months).toLocaleString() : 0 }}
          </p>
        </a-form-item>

        <a-form-item label="Reason for Loan" required>
          <a-textarea v-model:value="loanForm.reason" :rows="5" size="large" />
        </a-form-item>
      </a-form>

      <template #footer>
        <a-button @click="showRequestModal = false">Cancel</a-button>
        <a-button type="primary" :loading="submitting" @click="submitLoanRequest">
          Submit Request
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

const loans = ref([])
const showRequestModal = ref(false)
const submitting = ref(false)

const loanForm = ref({
  amount: null as number | null,
  months: null as number | null,
  reason: '',
})

const columns = [
  { title: 'Amount', key: 'amount' },
  { title: 'Months', dataIndex: 'months' },
  { title: 'Reason', dataIndex: 'reason' },
  { title: 'Progress', key: 'progress' },
  { title: 'Status', key: 'status' },
]

const statusColor = (status: string) => {
  if (status === 'approved') return 'green'
  if (status === 'rejected') return 'red'
  if (status === 'completed') return 'blue'
  return 'orange'
}

const fetchLoans = async () => {
  try {
    const res = await api.get('/loans/my')
    loans.value = res.data
  } catch {
    notification.error({ message: 'Failed to load loans' })
  }
}

const submitLoanRequest = async () => {
  if (!loanForm.value.amount || !loanForm.value.months || !loanForm.value.reason.trim()) {
    notification.error({ message: 'Please fill all fields' })
    return
  }

  submitting.value = true
  try {
    await api.post('/loans/request', loanForm.value)
    notification.success({ message: 'Loan request submitted!' })
    showRequestModal.value = false
    loanForm.value = { amount: null, months: null, reason: '' }
    fetchLoans()
  } catch (err: any) {
    notification.error({ message: err.response?.data?.message || 'Failed' })
  } finally {
    submitting.value = false
  }
}

onMounted(fetchLoans)
</script>