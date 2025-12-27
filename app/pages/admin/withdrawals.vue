<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Pending Withdrawal Requests</h1>
        <p class="text-slate-600 mt-2">Review and process employee withdrawal requests</p>
      </div>
      <a-tag color="orange" class="text-lg px-4 py-2">
        {{ requests.length }} Pending
      </a-tag>
    </div>

    <a-card class="shadow-lg">
      <a-table
        :columns="columns"
        :data-source="requests"
        row-key="id"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
      >
        <template #bodyCell="{ column, record }">
          <!-- Employee -->
          <template v-if="column.key === 'employee'">
            <div class="flex items-center gap-4">
              <a-avatar size="large" style="background-color:#1677ff">
                {{ record.wallet.employee.first_name.charAt(0).toUpperCase() }}
              </a-avatar>
              <div>
                <p class="font-semibold text-slate-800">
                  {{ record.wallet.employee.first_name }} {{ record.wallet.employee.last_name }}
                </p>
                <p class="text-sm text-slate-500">{{ record.wallet.employee.email }}</p>
              </div>
            </div>
          </template>

          <!-- Amount -->
          <template v-if="column.key === 'amount'">
            <p class="text-2xl font-bold text-error">
              -₦{{ Number(record.amount).toLocaleString() }}
            </p>
            <p class="text-xs text-slate-500">Balance after: ₦{{ Number(record.wallet.balance - record.amount).toLocaleString() }}</p>
          </template>

          <!-- Reason -->
          <template v-if="column.key === 'reason'">
            <p class="text-slate-700">{{ record.description }}</p>
            <p class="text-xs text-slate-500 mt-1">
              Requested {{ formatDate(record.created_at) }}
            </p>
          </template>

          <!-- Action -->
          <template v-if="column.key === 'action'">
            <a-space>
              <a-button
                type="primary"
                size="large"
                @click="openProcessModal(record, 'approve')"
              >
                <check-outlined class="mr-2" />
                Approve
              </a-button>
              <a-button
                type="default"
                danger
                size="large"
                @click="openProcessModal(record, 'reject')"
              >
                <close-outlined class="mr-2" />
                Reject
              </a-button>
            </a-space>
          </template>
        </template>

        <template #emptyText>
          <div class="text-center py-16">
            <div class="text-8xl text-slate-200 mb-6">✓</div>
            <p class="text-xl text-slate-600">No pending requests</p>
            <p class="text-slate-500 mt-2">All withdrawal requests have been processed</p>
          </div>
        </template>
      </a-table>
    </a-card>

    <!-- Process Modal -->
    <a-modal
      v-model:open="showProcessModal"
      :title="processAction === 'approve' ? 'Approve Withdrawal' : 'Reject Withdrawal'"
      width="600px"
    >
      <div class="mb-6 p-6 bg-slate-50 rounded-xl">
        <p class="text-slate-700">
          <strong>Employee:</strong> {{ currentRequest?.wallet.employee.first_name }} {{ currentRequest?.wallet.employee.last_name }}
        </p>
        <p class="text-slate-700 mt-2">
          <strong>Amount:</strong>
          <span class="text-2xl font-bold text-error ml-2">
            -₦{{ Number(currentRequest?.amount).toLocaleString() }}
          </span>
        </p>
        <p class="text-slate-700 mt-4">
          <strong>Reason:</strong><br>
          <span class="italic text-slate-600">{{ currentRequest?.description }}</span>
        </p>
      </div>

      <a-form layout="vertical">
        <a-form-item label="Admin Note (Optional)">
          <a-textarea
            v-model:value="processNote"
            placeholder="Add a note for the employee (e.g., Approved for medical emergency)"
            :rows="4"
            :max-length="500"
            show-count
          />
        </a-form-item>
      </a-form>

      <template #footer>
        <a-button @click="showProcessModal = false">
          Cancel
        </a-button>
        <a-button
          :type="processAction === 'approve' ? 'primary' : 'default'"
          danger
          :loading="processing"
          @click="confirmProcess"
        >
          {{ processAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection' }}
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'
import {
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'

const requests = ref<any[]>([])
const loading = ref(false)

const showProcessModal = ref(false)
const processAction = ref<'approve' | 'reject'>('approve')
const processNote = ref('')
const currentRequest = ref<any>(null)
const processing = ref(false)

const columns = [
  { title: 'Employee', key: 'employee', width: 300 },
  { title: 'Amount', key: 'amount', width: 200 },
  { title: 'Reason', key: 'reason' },
  { title: 'Action', key: 'action', width: 250 },
]

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchRequests = async () => {
  loading.value = true
  try {
    const res = await api.get('/wallet/pending-withdrawals')
    requests.value = res.data.data || res.data // Handle pagination if added
  } catch (err) {
    notification.error({ message: 'Failed to load withdrawal requests' })
  } finally {
    loading.value = false
  }
}

const openProcessModal = (record: any, action: 'approve' | 'reject') => {
  currentRequest.value = record
  processAction.value = action
  processNote.value = ''
  showProcessModal.value = true
}

const confirmProcess = async () => {
  if (!currentRequest.value) return

  processing.value = true
  try {
    await api.post(`/wallet/process/${currentRequest.value.id}`, {
      action: processAction.value,
      note: processNote.value.trim(),
    })

    notification.success({
      message: `Withdrawal ${processAction.value === 'approve' ? 'Approved' : 'Rejected'}`,
      description: processAction.value === 'approve' 
        ? 'Funds will be released to the employee' 
        : 'Request has been denied',
    })

    showProcessModal.value = false
    fetchRequests()
  } catch (err: any) {
    notification.error({
      message: 'Failed to process request',
      description: err.response?.data?.message || 'Please try again',
    })
  } finally {
    processing.value = false
  }
}

onMounted(fetchRequests)
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