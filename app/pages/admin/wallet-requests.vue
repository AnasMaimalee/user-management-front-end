<template>
  <div class="p-6">
    <h1 class="text-3xl font-bold mb-8">Pending Withdrawal Requests</h1>

    <a-table
      :columns="columns"
      :data-source="requests"
      row-key="id"
      :loading="loading"
      class="bg-white rounded-xl shadow"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'employee'">
          <div class="flex items-center gap-3">
            <a-avatar style="background-color:#1677ff">
              {{ record.wallet.employee.first_name.charAt(0) }}
            </a-avatar>
            <div>
              <p class="font-medium">{{ record.wallet.employee.first_name }} {{ record.wallet.employee.last_name }}</p>
              <p class="text-xs text-slate-500">{{ record.wallet.employee.email }}</p>
            </div>
          </div>
        </template>

        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="primary" size="small" @click="process(record, 'approve')">
              Approve
            </a-button>
            <a-button danger size="small" @click="process(record, 'reject')">
              Reject
            </a-button>
          </a-space>
        </template>
      </template>
    </a-table>

    <!-- Approval/Rejection Modal -->
    <a-modal v-model:open="showProcessModal" :title="` ${processAction === 'approve' ? 'Approve' : 'Reject'} Withdrawal`">
      <a-form layout="vertical">
        <a-form-item label="Admin Note (Optional)">
          <a-textarea v-model:value="processNote" :rows="4" placeholder="Add a note for the employee" />
        </a-form-item>
      </a-form>
      <template #footer>
        <a-button @click="showProcessModal = false">Cancel</a-button>
        <a-button type="primary" danger v-if="processAction === 'reject'" @click="confirmProcess">
          Confirm Reject
        </a-button>
        <a-button type="primary" v-else @click="confirmProcess">
          Confirm Approve
        </a-button>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

const requests = ref([])
const loading = ref(false)

const showProcessModal = ref(false)
const processAction = ref<'approve' | 'reject'>('approve')
const processNote = ref('')
const currentTransaction = ref<any>(null)

const columns = [
  { title: 'Employee', key: 'employee' },
  { title: 'Amount', dataIndex: 'amount', key: 'amount' },
  { title: 'Reason', dataIndex: 'description', key: 'reason' },
  { title: 'Date', dataIndex: 'created_at', key: 'date' },
  { title: 'Action', key: 'action', width: 200 },
]

const fetchRequests = async () => {
  loading.value = true
  try {
    const res = await api.get('/wallet/pending-withdrawals')
    requests.value = res.data
  } catch {
    notification.error({ message: 'Failed to load requests' })
  } finally {
    loading.value = false
  }
}

const process = (record: any, action: 'approve' | 'reject') => {
  currentTransaction.value = record
  processAction.value = action
  processNote.value = ''
  showProcessModal.value = true
}

const confirmProcess = async () => {
  try {
    await api.post(`/wallet/process/${currentTransaction.value.id}`, {
      action: processAction.value,
      note: processNote.value,
    })
    notification.success({ message: `Withdrawal ${processAction.value}d!` })
    showProcessModal.value = false
    fetchRequests()
  } catch {
    notification.error({ message: 'Failed to process request' })
  }
}

onMounted(fetchRequests)
</script>