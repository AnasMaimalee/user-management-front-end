<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">My Leave Requests</h1>

      <a-button type="primary" size="large" @click="showCreateModal = true">
        <template #icon>
          <plus-outlined />
        </template>
        Request Leave
      </a-button>
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

        <!-- Dates -->
        <template v-else-if="column.key === 'dates'">
          <div class="text-sm">
            <div class="font-medium">
              {{ formatDate(record.start_date) }} → {{ formatDate(record.end_date) }}
            </div>
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

        <!-- Admin Note -->
        <template v-else-if="column.key === 'admin_note'">
          <div v-if="record.admin_note" class="text-sm text-slate-700 max-w-md">
            <span class="font-medium text-slate-900"></span>
            <p class="mt-1 italic text-slate-600 leading-relaxed">{{ record.admin_note }}</p>
          </div>
          <span v-else class="text-slate-400 text-sm">—</span>
        </template>
      </template>

      <template #emptyText>
        <div class="py-12 text-center">
          <p class="text-slate-500 text-lg">You have no leave requests yet.</p>
          <p class="text-slate-400 mt-2">Click "Request Leave" to submit your first one.</p>
        </div>
      </template>
    </a-table>

    <!-- Create Leave Request Modal -->
    <a-modal
      v-model:open="showCreateModal"
      title="Request New Leave"
      :confirm-loading="createLoading"
      @ok="handleCreate"
      ok-text="Submit Request"
      cancel-text="Cancel"
      width="600px"
    >
      <a-form layout="vertical" :model="form" ref="formRef">
        <a-form-item
          label="Leave Dates"
          name="dateRange"
          :rules="[{ required: true, message: 'Please select start and end date' }]"
        >
          <a-range-picker
            v-model:value="form.dateRange"
            :placeholder="['Start Date', 'End Date']"
            class="w-full"
            :disabled-date="disabledDate"
            format="MMM D, YYYY"
          />
        </a-form-item>

        <a-form-item
          label="Reason"
          name="reason"
          :rules="[{ required: true, message: 'Please provide a reason' }, { min: 10, message: 'Reason must be at least 10 characters' }]"
        >
          <a-textarea
            v-model:value="form.reason"
            placeholder="Explain why you need this leave..."
            :rows="4"
            :max-length="255"
            show-count
          />
        </a-form-item>

        <div class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p class="text-sm text-blue-800">
            <strong>Resume Date:</strong>
            {{ resumeDate ? formatDate(resumeDate) : '—' }}
          </p>
          <p class="text-xs text-blue-600 mt-1">
            You will return to work on the day after your leave ends.
          </p>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '~/utils/api'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'

const leaves = ref<any[]>([])
const error = ref<string | null>(null)
const loading = ref(false)
const createLoading = ref(false)
const showCreateModal = ref(false)

const form = ref({
  dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  reason: '',
})

const columns = [
  { title: '#', key: 'index', width: 70, fixed: 'left' },
  { title: 'Dates', key: 'dates', width: 260 },
  { title: 'Reason', key: 'reason' },
  { title: 'Status', key: 'status', width: 140 },
  { title: 'Admin Note', key: 'admin_note', width: 320 },
]

// Computed resume date (end_date + 1 day)
const resumeDate = computed(() => {
  if (!form.value.dateRange || !form.value.dateRange[1]) return null
  return form.value.dateRange[1].add(1, 'day').format('YYYY-MM-DD')
})

// Disable past dates
const disabledDate = (current: dayjs.Dayjs) => {
  return current && current < dayjs().startOf('day')
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

const fetchMyLeaves = async () => {
  loading.value = true
  try {
    const res = await api.get('/leaves/my')
    leaves.value = res.data || []
    error.value = null
  } catch (err: any) {
    console.error('Fetch my leaves error:', err)
    error.value = err.response?.data?.message || 'Failed to load your leave requests'
    message.error(error.value)
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!form.value.dateRange || form.value.reason.trim().length < 10) {
    message.error('Please fill in all required fields correctly')
    return
  }

  createLoading.value = true
  try {
    await api.post('/leaves', {
      start_date: form.value.dateRange[0].format('YYYY-MM-DD'),
      end_date: form.value.dateRange[1].format('YYYY-MM-DD'),
      resume_date: form.value.dateRange[1].add(1, 'day').format('YYYY-MM-DD'),
      reason: form.value.reason.trim(),
    })

    message.success('Leave request submitted successfully!')
    showCreateModal.value = false
    form.value = { dateRange: null, reason: '' } // reset form
    fetchMyLeaves()
  } catch (err: any) {
    message.error(err.response?.data?.message || 'Failed to submit leave request')
  } finally {
    createLoading.value = false
  }
}

onMounted(fetchMyLeaves)
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