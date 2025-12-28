<template>
  <div class="p-6 bg-slate-50 min-h-screen">
    <div class="max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-3xl font-bold text-slate-800">Loan Requests</h1>
          <p class="text-slate-600 mt-2">Review and process employee loan applications</p>
        </div>
        <a-tag color="orange" size="large" class="text-lg px-6 py-2">
          {{ pendingCount }} Pending
        </a-tag>
      </div>

      <a-card class="shadow-lg">
        <a-table
          :columns="columns"
          :data-source="loans"
          row-key="id"
          :loading="loading"
          :pagination="{ pageSize: 10 }"
        >
          <template #bodyCell="{ column, record }">
            <!-- Employee -->
            <template v-if="column.key === 'employee'">
              <div class="flex items-center gap-4">
                <a-avatar size="large" style="background-color:#1677ff">
                  {{ record.employee.first_name.charAt(0).toUpperCase() }}
                </a-avatar>
                <div>
                  <p class="font-semibold text-slate-800">
                    {{ record.employee.first_name }} {{ record.employee.last_name }}
                  </p>
                  <p class="text-sm text-slate-500">{{ record.employee.email }}</p>
                </div>
              </div>
            </template>

            <!-- Amount & Terms -->
            <template v-if="column.key === 'details'">
              <p class="text-2xl font-bold text-primary">
                ₦{{ Number(record.amount).toLocaleString() }}
              </p>
              <p class="text-sm text-slate-600 mt-1">
                {{ record.months }} months • Monthly: ₦{{ Number(record.monthly_deduction).toLocaleString() }}
              </p>
            </template>

            <!-- Reason -->
            <template v-if="column.key === 'reason'">
              <p class="text-slate-700 line-clamp-2">{{ record.reason }}</p>
              <p class="text-xs text-slate-500 mt-2">
                Requested {{ formatDate(record.created_at) }}
              </p>
            </template>

            <!-- Status -->
            <template v-if="column.key === 'status'">
              <a-tag :color="statusColor(record.status)" class="px-4 py-1 text-base">
                {{ record.status.toUpperCase() }}
              </a-tag>
            </template>

            <!-- Action -->
            <template v-if="column.key === 'action'">
              <a-space v-if="record.status === 'pending'">
                <a-button type="primary" size="large" @click="openModal(record, 'approve')">
                  <check-outlined class="mr-2" />
                  Approve
                </a-button>
                <a-button danger size="large" @click="openModal(record, 'reject')">
                  <close-outlined class="mr-2" />
                  Reject
                </a-button>
              </a-space>
              <span v-else class="text-slate-500">Processed</span>
            </template>
          </template>

          <template #emptyText>
            <div class="text-center py-16">
              <div class="text-8xl text-slate-200 mb-6">✓</div>
              <p class="text-xl text-slate-600">No pending loan requests</p>
              <p class="text-slate-500 mt-2">All applications have been processed</p>
            </div>
          </template>
        </a-table>
      </a-card>

      <!-- Process Modal -->
      <a-modal
        v-model:open="showModal"
        :title="modalAction === 'approve' ? 'Approve Loan Request' : 'Reject Loan Request'"
        width="600px"
      >
        <div class="mb-6 p-6 bg-slate-50 rounded-xl">
          <p class="text-slate-700">
            <strong>Employee:</strong> {{ currentLoan?.employee.first_name }} {{ currentLoan?.employee.last_name }}
          </p>
          <p class="text-slate-700 mt-3">
            <strong>Amount:</strong>
            <span class="text-3xl font-bold text-primary ml-3">
              ₦{{ Number(currentLoan?.amount).toLocaleString() }}
            </span>
          </p>
          <p class="text-slate-700 mt-3">
            <strong>Terms:</strong> {{ currentLoan?.months }} months • Monthly deduction: ₦{{ Number(currentLoan?.monthly_deduction).toLocaleString() }}
          </p>
          <p class="text-slate-700 mt-4">
            <strong>Reason:</strong><br>
            <span class="italic text-slate-600 mt-2 block">{{ currentLoan?.reason }}</span>
          </p>
        </div>

        <a-form layout="vertical">
          <a-form-item label="Admin Note (Optional)">
            <a-textarea
              v-model:value="adminNote"
              placeholder="Add a note for the employee (e.g., Approved for medical emergency)"
              :rows="4"
              :max-length="500"
              show-count
            />
          </a-form-item>
        </a-form>

        <template #footer>
          <a-button @click="showModal = false">Cancel</a-button>
          <a-button
            :type="modalAction === 'approve' ? 'primary' : 'default'"
            danger
            :loading="processing"
            @click="submitDecision"
          >
            {{ modalAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection' }}
          </a-button>
        </template>
      </a-modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'
import { CheckOutlined, CloseOutlined } from '@ant-design/icons-vue'

const loans = ref<any[]>([])
const loading = ref(false)

const showModal = ref(false)
const modalAction = ref<'approve' | 'reject'>('approve')
const adminNote = ref('')
const currentLoan = ref<any>(null)
const processing = ref(false)

const pendingCount = computed(() => loans.value.filter(l => l.status === 'pending').length)

const columns = [
  { title: 'Employee', key: 'employee', width: 300 },
  { title: 'Amount & Terms', key: 'details', width: 250 },
  { title: 'Reason', key: 'reason' },
  { title: 'Status', key: 'status', width: 120 },
  { title: 'Action', key: 'action', width: 280 },
]

const statusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'green'
    case 'rejected': return 'red'
    case 'completed': return 'blue'
    default: return 'orange'
  }
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchLoans = async () => {
  loading.value = true
  try {
    const res = await api.get('/loans/pending')
    loans.value = res.data
  } catch {
    notification.error({ message: 'Failed to load loan requests' })
  } finally {
    loading.value = false
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
      message: `Loan request ${modalAction.value === 'approve' ? 'approved' : 'rejected'}!`,
      description: modalAction.value === 'approve'
        ? 'Monthly deductions will begin next payroll'
        : 'Employee has been notified',
    })

    showModal.value = false
    fetchLoans()
  } catch (err: any) {
    notification.error({
      message: 'Failed to process',
      description: err.response?.data?.message || 'Please try again',
    })
  } finally {
    processing.value = false
  }
}

onMounted(fetchLoans)
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background-color: #f8fafc !important;
  font-weight: 600;
  color: #334155;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f0f9ff !important;
}
</style>