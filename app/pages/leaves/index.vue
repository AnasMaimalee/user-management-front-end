<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">Leave Requests</h1>
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
      :data-source="leaves"
      row-key="id"
      bordered
      :loading="loading"
      class="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <template #bodyCell="{ column, record, index }">
        <!-- Index -->
        <template v-if="column.key === 'index'">
          <span class="text-slate-600 font-semibold">{{ index + 1 }}</span>
        </template>

        <!-- Employee -->
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
              <div class="text-xs text-slate-500">
                {{ record.employee?.email || '—' }}
              </div>
            </div>
          </div>
        </template>

        <!-- Dates -->
        <template v-else-if="column.key === 'dates'">
          <div class="text-sm">
            <div>{{ formatDate(record.start_date) }} → {{ formatDate(record.end_date) }}</div>
            <div class="text-xs text-slate-500 mt-1">
              Resume: {{ formatDate(record.resume_date) || '—' }}
            </div>
          </div>
        </template>

        <!-- Reason -->
        <template v-else-if="column.key === 'reason'">
          <span class="text-slate-600">{{ record.reason || '—' }}</span>
        </template>

        <!-- Status -->
        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)">
            <template #icon>
              <span
                class="w-2 h-2 rounded-full inline-block mr-1"
                :class="{
                  'bg-green-500': record.status === 'approved',
                  'bg-red-500': record.status === 'rejected',
                  'bg-orange-500': record.status === 'pending'
                }"
              ></span>
            </template>
            {{ statusText(record.status) }}
          </a-tag>
        </template>

        <!-- Actions -->
        <template v-else-if="column.key === 'actions'">
          <a-dropdown
            v-if="record.status === 'pending' && userStore.can('update leaves')"
            trigger="click"
          >
            <a-button type="text" size="small">
              <ellipsis-outlined class="text-lg text-slate-600 hover:text-slate-900 transition" />
            </a-button>
            <template #overlay>
              <a-menu class="shadow-lg">
                <a-menu-item @click="openStatusModal(record, 'approved')" class="flex items-center">
                  <check-circle-outlined class="mr-2 text-green-600" /> Approve
                </a-menu-item>
                <a-menu-item @click="openStatusModal(record, 'rejected')" class="flex items-center text-red-600">
                  <close-circle-outlined class="mr-2" /> Reject
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>

          <span v-else class="text-slate-400 text-sm">—</span>
        </template>
      </template>
    </a-table>

    <!-- Status Update Modal -->
    <a-modal
      v-model:open="statusModal.visible"
      :title="modalTitle"
      :confirm-loading="statusModal.loading"
      @ok="handleStatusUpdate"
      ok-text="Confirm"
      cancel-text="Cancel"
      width="520px"
      :ok-button-props="okButtonProps"
    >
      <div class="mb-5">
        <p class="text-slate-700 leading-relaxed">
          <strong>{{ fullName(statusModal.record?.employee) }}</strong> requested leave from
          <strong>{{ formatDate(statusModal.record?.start_date) }}</strong> to
          <strong>{{ formatDate(statusModal.record?.end_date) }}</strong>.
        </p>
        <p class="text-slate-600 mt-3">
          <strong>Reason:</strong>
          <span class="ml-2 italic">{{ statusModal.record?.reason || 'No reason provided' }}</span>
        </p>
      </div>

      <a-form layout="vertical">
        <a-form-item
          :label="noteLabel"
          :help="noteHelp"
          :validate-status="noteError ? 'error' : ''"
          :has-feedback="!!noteError"
        >
          <a-textarea
            v-model:value="statusModal.note"
            :placeholder="notePlaceholder"
            :rows="4"
            :max-length="255"
            show-count
            @input="noteError = ''"
          />
          <div v-if="noteError" class="ant-form-item-explain-error text-red-600 text-sm mt-1">
            {{ noteError }}
          </div>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import api from '~/utils/api'
import {
  EllipsisOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons-vue'
import { useUserStore } from '~/stores/user'
import dayjs from 'dayjs'
// At the top of <script setup>
const { $message } = useNuxtApp()  // ← This works reliably
// ← CORRECT: Get notification from Nuxt app context
const { $notification } = useNuxtApp()

const userStore = useUserStore()
await userStore.fetchUser()

const leaves = ref<any[]>([])
const error = ref<string | null>(null)
const loading = ref(false)
const noteError = ref<string>('')

// Modal state
const statusModal = reactive({
  visible: false,
  loading: false,
  action: '' as 'approved' | 'rejected' | '',
  record: null as any,
  note: '',
})

// Computed modal properties
const modalTitle = computed(() => {
  return statusModal.action === 'approved'
    ? 'Approve Leave Request'
    : 'Reject Leave Request'
})

const okButtonProps = computed(() => ({
  type: statusModal.action === 'approved' ? 'primary' : 'default',
  danger: statusModal.action === 'rejected',
}))

const noteLabel = computed(() => {
  return statusModal.action === 'rejected' ? 'Admin Note (Required)' : 'Admin Note (Optional)'
})

const noteHelp = computed(() => {
  return statusModal.action === 'rejected'
    ? 'Please provide a reason for rejection (min. 10 characters)'
    : 'You may add a note for the employee'
})

const notePlaceholder = computed(() => {
  return statusModal.action === 'rejected'
    ? 'Explain why this leave is being rejected...'
    : 'Add a friendly note (e.g., Enjoy your time off!)'
})

const columns = [
  { title: '#', key: 'index', width: 70, fixed: 'left' },
  { title: 'Employee', key: 'employee', width: 280 },
  { title: 'Dates', key: 'dates', width: 240 },
  { title: 'Reason', key: 'reason' },
  { title: 'Status', key: 'status', width: 140 },
  { title: 'Actions', key: 'actions', width: 100, fixed: 'right' },
]

// Helpers
const fullName = (employee: any) => {
  if (!employee) return 'Unknown'
  return `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown'
}

const getInitials = (employee: any) => {
  if (!employee) return 'NA'
  const first = employee.first_name?.[0] || ''
  const last = employee.last_name?.[0] || ''
  return (first + last).toUpperCase() || 'NA'
}

const formatDate = (date: string | null) => {
  return date ? dayjs(date).format('MMM D, YYYY') : '—'
}

const statusText = (status: string) => {
  if (!status) return 'UNKNOWN'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

const statusColor = (status: string) => {
  switch (status) {
    case 'approved': return 'green'
    case 'rejected': return 'volcano'
    case 'pending': return 'orange'
    default: return 'default'
  }
}

const fetchLeaves = async () => {
  loading.value = true
  try {
    const res = await api.get('/leaves')
    leaves.value = res.data
    error.value = null
  } catch (err: any) {
    console.error('Fetch leaves error:', err)
    error.value = err.response?.data?.message || 'Failed to load leave requests'
  } finally {
    loading.value = false
  }
}

const openStatusModal = (record: any, action: 'approved' | 'rejected') => {
  statusModal.record = record
  statusModal.action = action
  statusModal.note = ''
  noteError.value = ''
  statusModal.visible = true
}

const handleStatusUpdate = async () => {
  if (!statusModal.record || !statusModal.action) return

  if (statusModal.action === 'rejected') {
    if (!statusModal.note.trim()) {
      noteError.value = 'Admin note is required when rejecting a leave request.'
      return
    }
    if (statusModal.note.trim().length < 10) {
      noteError.value = 'Admin note must be at least 10 characters long.'
      return
    }
  }

  statusModal.loading = true
  noteError.value = ''

  try {
    await api.patch(`/leaves/${statusModal.record.id}`, {
      status: statusModal.action,
      admin_note: statusModal.note.trim() || null,
    })

    // ← Use $message (reliable in Nuxt)
    $message.success({
      content: `Leave request ${statusModal.action === 'approved' ? 'approved' : 'rejected'} successfully!`,
      duration: 4,
    })

    statusModal.visible = false
    fetchLeaves()
  } catch (err: any) {
    console.error('Update error:', err)

    let errorMessage = 'Failed to update leave status'
    if (err.response?.data?.message) {
      errorMessage = err.response.data.message
    } else if (!err.response) {
      errorMessage = 'Network error. Please check your connection.'
    }

    $message.error({
      content: errorMessage,
      duration: 5,
    })
  } finally {
    statusModal.loading = false
  }
}

onMounted(fetchLeaves)
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