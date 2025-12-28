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
            <div>
              {{ formatDate(record.start_date) }} →
              {{ formatDate(record.end_date) }}
            </div>
            <div class="text-xs text-slate-500 mt-1">
              Resume: {{ formatDate(record.resume_date) }}
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
              <EllipsisOutlined class="text-lg" />
            </a-button>

            <template #overlay>
              <a-menu>
                <a-menu-item @click="openStatusModal(record, 'approved')">
                  <CheckCircleOutlined class="mr-2 text-green-600" />
                  Approve
                </a-menu-item>

                <a-menu-item @click="openStatusModal(record, 'rejected')">
                  <CloseCircleOutlined class="mr-2 text-red-600" />
                  Reject
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>

          <span v-else class="text-slate-400">—</span>
        </template>
      </template>
    </a-table>

    <!-- Status Modal -->
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
      <p class="mb-4 text-slate-700">
        <strong>{{ fullName(statusModal.record?.employee) }}</strong>
        requested leave from
        <strong>{{ formatDate(statusModal.record?.start_date) }}</strong>
        to
        <strong>{{ formatDate(statusModal.record?.end_date) }}</strong>
      </p>

      <a-form layout="vertical">
        <a-form-item
          :label="noteLabel"
          :validate-status="noteError ? 'error' : ''"
          :help="noteError || noteHelp"
        >
          <a-textarea
            v-model:value="statusModal.note"
            :rows="4"
            :placeholder="notePlaceholder"
            show-count
            :max-length="255"
          />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import api from '~/utils/api'
import { useUserStore } from '~/stores/user'
import {
  EllipsisOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons-vue'
import { notification } from 'ant-design-vue'


const userStore = useUserStore()
await userStore.fetchUser()

const leaves = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const noteError = ref('')

const statusModal = reactive({
  visible: false,
  loading: false,
  action: '' as 'approved' | 'rejected' | '',
  record: null as any,
  note: '',
})

const columns = [
  { title: '#', key: 'index', width: 60 },
  { title: 'Employee', key: 'employee', width: 260 },
  { title: 'Dates', key: 'dates', width: 220 },
  { title: 'Reason', key: 'reason' },
  { title: 'Status', key: 'status', width: 120 },
  { title: 'Actions', key: 'actions', width: 100 },
]

const modalTitle = computed(() =>
  statusModal.action === 'approved'
    ? 'Approve Leave Request'
    : 'Reject Leave Request'
)

const okButtonProps = computed(() => ({
  danger: statusModal.action === 'rejected',
}))

const noteLabel = computed(() =>
  statusModal.action === 'rejected'
    ? 'Admin Note (Required)'
    : 'Admin Note (Optional)'
)

const noteHelp = computed(() =>
  statusModal.action === 'rejected'
    ? 'Minimum 10 characters required'
    : 'Optional message for employee'
)

const notePlaceholder = computed(() =>
  statusModal.action === 'rejected'
    ? 'Explain why this leave is rejected...'
    : 'Optional note'
)

const fullName = (e: any) =>
  e ? `${e.first_name || ''} ${e.last_name || ''}`.trim() : 'Unknown'

const getInitials = (e: any) =>
  e ? `${e.first_name?.[0] || ''}${e.last_name?.[0] || ''}`.toUpperCase() : 'NA'

const formatDate = (d: string | null) =>
  d ? dayjs(d).format('MMM D, YYYY') : '—'

const statusText = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'

const statusColor = (s: string) =>
  s === 'approved' ? 'green' : s === 'rejected' ? 'volcano' : 'orange'

const fetchLeaves = async () => {
  loading.value = true
  try {
    const res = await api.get('/leaves')
    leaves.value = res.data
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Failed to load leaves'
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

    notification.success({
      message: 'Success',
      description: `Leave request has been ${statusModal.action} successfully`,
      placement: 'topRight',
    })

    statusModal.visible = false
    fetchLeaves()
  } catch (err: any) {
    let errorMessage = 'Failed to update leave status'

    if (err.response?.data?.message) {
      errorMessage = err.response.data.message
    }

    notification.error({
      message: 'Error',
      description: errorMessage,
      placement: 'topRight',
    })
  } finally {
    statusModal.loading = false
  }
}



onMounted(fetchLeaves)
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background: #f1f5f9;
  font-weight: 600;
}
</style>
