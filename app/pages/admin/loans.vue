<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
    <div class="w-full px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-10 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-4xl font-bold text-slate-800 mb-3">Loan Requests</h1>
          <p class="text-lg text-slate-600">Review and manage employee loan applications</p>
        </div>

        <a-tag 
          color="orange" 
          class="text-xl px-8 py-4 rounded-full shadow-lg font-semibold flex items-center gap-3"
          :loading="countLoading"
        >
          <clock-circle-outlined class="text-2xl" />
          {{ pendingCount }} Pending
        </a-tag>
      </div>

      <!-- Pending Loans Table -->
      <PendingLoansTable 
        @process="openModal" 
        ref="pendingTableRef"
        @refresh="refreshAll" 
      />

      <!-- Loan History -->
      <div class="mt-12">
        <LoanHistoryTable 
        ref="historyTableRef"
        @refresh="refreshAll" />
      </div>
    </div>

    <!-- Process Modal -->
    <a-modal
      v-model:open="showModal"
      :title="modalAction === 'approve' ? 'Approve Loan Request' : 'Reject Loan Request'"
      width="800px"
      centered
      :footer="null"
      destroy-on-close
    >
      <div v-if="currentLoan" class="space-y-8">
        <!-- Your existing beautiful modal content here -->
        <!-- (Keep everything you had before) -->
        <div class="text-center text-6xl mb-6">💼</div>
        <h3 class="text-2xl font-bold text-slate-800">
          {{ currentLoan.employee.first_name }} {{ currentLoan.employee.last_name }}
        </h3>
        <p class="text-lg text-slate-600">{{ currentLoan.employee.employee_code }}</p>

        <div class="grid grid-cols-3 gap-6 mt-8">
          <div class="bg-indigo-50 rounded-xl p-6 text-center">
            <p class="text-sm text-slate-600">Amount</p>
            <p class="text-3xl font-bold text-indigo-600">₦{{ Number(currentLoan.amount).toLocaleString() }}</p>
          </div>
          <div class="bg-slate-50 rounded-xl p-6 text-center">
            <p class="text-sm text-slate-600">Months</p>
            <p class="text-3xl font-bold">{{ currentLoan.months }}</p>
          </div>
          <div class="bg-green-50 rounded-xl p-6 text-center">
            <p class="text-sm text-slate-600">Monthly</p>
            <p class="text-3xl font-bold text-green-600">₦{{ Number(currentLoan.monthly_deduction).toLocaleString() }}</p>
          </div>
        </div>

        <div class="mt-8">
          <p class="font-semibold text-slate-700 mb-3">Reason</p>
          <p class="bg-slate-50 p-6 rounded-xl italic text-slate-700 border-l-4 border-indigo-500">
            "{{ currentLoan.reason }}"
          </p>
        </div>

        <a-form layout="vertical" class="mt-8">
          <a-form-item label="Admin Note (Optional)">
            <a-textarea
              v-model:value="adminNote"
              placeholder="Add approval conditions or rejection reason..."
              :rows="4"
              show-count
              :max-length="500"
            />
          </a-form-item>
        </a-form>

        <div class="flex justify-end gap-4 mt-10">
          <a-button size="large" @click="showModal = false">Cancel</a-button>
          <a-button
            size="large"
            :type="modalAction === 'approve' ? 'primary' : 'default'"
            :danger="modalAction === 'reject'"
            :loading="processing"
            @click="submitDecision"
          >
            {{ modalAction === 'approve' ? 'Approve Loan' : 'Reject Loan' }}
          </a-button>
        </div>
      </div>
    </a-modal>
  </div>
</template><script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '~/utils/api'
import { notification, message } from 'ant-design-vue'
import { ClockCircleOutlined } from '@ant-design/icons-vue'
import PendingLoansTable from '~/components/loans/PendingLoansTable.vue'
import LoanHistoryTable from '~/components/loans/LoanHistoryTable.vue'

const showModal = ref(false)
const modalAction = ref<'approve' | 'reject'>('approve')
const adminNote = ref('')
const currentLoan = ref<any>(null)
const processing = ref(false)
const pendingCount = ref(0)
const countLoading = ref(false)

// Key refs for child components
const pendingTableRef = ref<any>(null)
const historyTableRef = ref<any>(null)

// Refresh both tables and count
const refreshAll = async () => {
  await fetchPendingCount()
  
  // Trigger refetch in both child tables
  if (pendingTableRef.value?.fetchPending) {
    pendingTableRef.value.fetchPending()
  }
  if (historyTableRef.value?.fetchHistory) {
    historyTableRef.value.fetchHistory()
  }

  message.success('Tables updated!')
}

const fetchPendingCount = async () => {
  countLoading.value = true
  try {
    const res = await api.get('/loans/pending')
    pendingCount.value = res.data.length
  } catch (err) {
    console.error('Failed to fetch pending count:', err)
    pendingCount.value = 0
  } finally {
    countLoading.value = false
  }
}

const openModal = (loan: any, action: 'approve' | 'reject') => {
  currentLoan.value = loan
  modalAction.value = action
  adminNote.value = ''
  showModal.value = true
}

const submitDecision = async () => {
  if (!currentLoan.value) return

  processing.value = true
  try {
    await api.post(`/loans/process/${currentLoan.value.id}`, {
      action: modalAction.value,
      note: adminNote.value.trim(),
    })

    notification.success({
      message: `Loan ${modalAction.value === 'approve' ? 'Approved' : 'Rejected'} Successfully!`
    })

    showModal.value = false
    adminNote.value = ''
    currentLoan.value = null

    // AUTO-REFRESH EVERYTHING
    await refreshAll()
  } catch (err: any) {
    notification.error({
      message: 'Failed to process loan',
      description: err.response?.data?.message || 'Please try again'
    })
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  fetchPendingCount()
})
</script>