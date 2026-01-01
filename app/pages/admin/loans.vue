<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
    <div class="w-full px-4 sm:px-6 lg:px-8 py-8">
      <!-- Header -->
      <div class="mb-10 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-4xl font-bold text-slate-800 mb-3">Loan Requests</h1>
          <p class="text-lg text-slate-600">Review and manage employee loan applications</p>
        </div>

        <a-tag color="orange" class="text-xl px-8 py-4 rounded-full shadow-lg font-semibold flex items-center gap-3">
          <clock-circle-outlined class="text-2xl" />
          {{ pendingCount }} Pending
        </a-tag>
      </div>

      <!-- Pending Loans Table -->
      <PendingLoansTable @process="openModal" @refresh="fetchPendingCount" />

      <!-- Loan History -->
      <div class="mt-12">
        <LoanHistoryTable />
      </div>
    </div>

    <!-- Process Modal (same as before) -->
    <a-modal
      v-model:open="showModal"
      :title="modalAction === 'approve' ? 'Approve Loan Request' : 'Reject Loan Request'"
      width="800px"
      centered
      :footer="null"
    >
      <!-- ... (keep your existing modal content here) ... -->
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'
import { ClockCircleOutlined } from '@ant-design/icons-vue'
import PendingLoansTable from '~/components/loans/PendingLoansTable.vue'
import LoanHistoryTable from '~/components/loans/LoanHistoryTable.vue'

const showModal = ref(false)
const modalAction = ref<'approve' | 'reject'>('approve')
const adminNote = ref('')
const currentLoan = ref<any>(null)
const processing = ref(false)
const pendingCount = ref(0)

const fetchPendingCount = async () => {
  try {
    const res = await api.get('/loans/pending')
    pendingCount.value = res.data.length
  } catch {
    pendingCount.value = 0
  }
}

const openModal = (loan: any, action: 'approve' | 'reject') => {
  currentLoan.value = loan
  modalAction.value = action
  adminNote.value = ''
  showModal.value = true
}

const submitDecision = async () => {
  // ... your existing submit logic
  // After success:
  fetchPendingCount()
}

onMounted(() => {
  fetchPendingCount()
})
</script>