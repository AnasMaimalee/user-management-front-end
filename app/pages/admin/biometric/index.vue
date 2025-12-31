<!-- pages/admin/biometric.vue -->
<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-3xl font-bold text-slate-800">Biometric Management</h1>
        <p class="text-slate-600 mt-1">Manage employee fingerprint enrollment</p>
      </div>

      <a-button type="primary" size="large" @click="showEnrollModal = true">
        <plus-outlined class="mr-2" />
        Enroll New Employee
      </a-button>
    </div>

    <!-- Error Alert -->
    <a-alert
      v-if="error"
      type="error"
      :message="error"
      show-icon
      closable
      class="mb-6 rounded-lg"
      @close="error = null"
    />

    <!-- Table -->
    <a-table
      :columns="columns"
      :data-source="allEmployees"
      row-key="id"
      bordered
      :loading="loading"
      class="bg-white rounded-xl shadow-lg overflow-hidden"
      :scroll="{ x: 1300 }"
    >
      <template #bodyCell="{ column, record, index }">
        <!-- Index -->
        <template v-if="column.key === 'index'">
          <span class="text-slate-600 font-semibold">{{ index + 1 }}</span>
        </template>

        <!-- Employee -->
        <template v-else-if="column.key === 'employee'">
          <div class="flex items-center gap-4">
            <a-avatar
              :size="44"
              class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold shadow-md"
            >
              {{ getInitials(record) }}
            </a-avatar>
            <div>
              <div class="font-semibold text-slate-800 text-base">
                {{ record.first_name }} {{ record.last_name }}
              </div>
              <div class="text-sm text-slate-500">
                ID: {{ record.id.slice(0, 8) }}... • {{ record.email }}
              </div>
            </div>
          </div>
        </template>

        <!-- Code -->
        <template v-else-if="column.key === 'code'">
          <a-tag color="blue" class="font-mono text-sm font-bold px-3 py-1">
            {{ record.employee_code || 'N/A' }}
          </a-tag>
        </template>

        <!-- Status -->
        <template v-else-if="column.key === 'status'">
          <div class="space-y-2">
            <!-- Fully Enrolled -->
            <div v-if="record.fingerprint_enrolled_at" class="flex items-center gap-2">
              <a-tag color="green" class="text-sm font-medium px-3 py-1">
                <check-circle-filled class="mr-1" />
                Fully Enrolled
              </a-tag>
              <div class="text-xs text-slate-500">
                {{ formatDate(record.fingerprint_enrolled_at) }}
              </div>
            </div>

            <!-- Pending Scan -->
            <div v-else-if="record.biometric_uid" class="flex items-center gap-2">
              <a-tag color="orange" class="text-sm font-medium px-3 py-1">
                <clock-circle-filled class="mr-1" />
                Pending Fingerprint Scan
              </a-tag>
            </div>

            <!-- Not Sent -->
            <div v-else class="flex items-center gap-2">
              <a-tag color="default" class="text-sm font-medium px-3 py-1">
                <close-circle-filled class="mr-1" />
                Not Sent
              </a-tag>
            </div>
          </div>
        </template>

        <!-- Actions -->
        <template v-else-if="column.key === 'actions'">
          <!-- Fully Enrolled: Reset -->
          <a-button
            v-if="record.fingerprint_enrolled_at"
            type="link"
            danger
            size="small"
            class="font-medium"
            @click="confirmReset(record)"
          >
            Reset Fingerprint
          </a-button>

          <!-- Pending: Resend -->
          <a-button
            v-else-if="record.biometric_uid"
            type="primary"
            size="small"
            class="font-medium"
            @click="resendToDevice(record)"
          >
            Resend to Device
          </a-button>

          <!-- Not Sent: Send -->
          <a-button
            v-else
            type="primary"
            ghost
            size="small"
            class="font-medium"
            @click="sendToDevice(record)"
          >
            Send to Device
          </a-button>
        </template>
      </template>

      <!-- Empty State -->
      <template #emptyText>
        <a-empty
          description="No employees found"
          :image="simpleImage"
        />
      </template>
    </a-table>

    <!-- Enroll Modal -->
   <a-modal
  v-model:open="showEnrollModal"
  title="Enroll New Employee"
  width="1200" 
  centered
  :body-style="{ padding: '24px' }"  
>
  <div class="space-y-6">
    <!-- Search bar with label -->
    <div>
      <label class="block text-sm font-medium text-slate-700 mb-2">
        Select Employee to Enroll
      </label>
      <a-select
        v-model:value="selectedEmployeeId"
        placeholder="Search by name, employee code, or email"
        show-search
        :filter-option="filterOption"
        :options="availableEmployeeOptions"
        style="width: 100%"
        size="large"  
        :dropdown-style="{ maxHeight: '400px' }" 
      />
    </div>

    <!-- Helpful info -->
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
      <strong>Note:</strong> Selected employee will be sent to the biometric device. 
      Ask them to place their finger on the scanner to complete enrollment.
    </div>
  </div>

  <template #footer>
    <div class="flex justify-end gap-4">
      <a-button @click="showEnrollModal = false" size="large">
        Cancel
      </a-button>
      <a-button
        type="primary"
        size="large"
        :loading="enrolling"
        :disabled="!selectedEmployeeId"
        @click="startEnrollment"
      >
        Send to Device
      </a-button>
    </div>
  </template>
</a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '~/utils/api'
import { message, Modal } from 'ant-design-vue'
import {
  PlusOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
} from '@ant-design/icons-vue'
import { Empty } from 'ant-design-vue'

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

const loading = ref(true)
const error = ref<string | null>(null)
const allEmployees = ref<any[]>([])

const showEnrollModal = ref(false)
const enrolling = ref(false)
const selectedEmployeeId = ref<string | null>(null)
const availableEmployeeOptions = ref<any[]>([])

const getInitials = (emp: any) => {
  const first = emp.first_name?.[0] || ''
  const last = emp.last_name?.[0] || ''
  return (first + last).toUpperCase() || 'NA'
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const filterOption = (input: string, option: any) =>
  option.label.toLowerCase().includes(input.toLowerCase())

// Fetch ALL employees
const fetchAllEmployees = async () => {
  loading.value = true
  try {
    const res = await api.get('/employees') // your endpoint that returns all employees
    allEmployees.value = res.data || []

    // Update dropdown options (only not sent)
    availableEmployeeOptions.value = allEmployees.value
      .filter(e => !e.biometric_uid)
      .map(e => ({
        value: e.id,
        label: `${e.first_name} ${e.last_name} (${e.employee_code || 'No Code'}) - ${e.email}`
      }))
  } catch (err: any) {
    error.value = 'Failed to load employees'
    console.error(err)
  } finally {
    loading.value = false
  }
}

// Send new from modal
const startEnrollment = async () => {
  if (!selectedEmployeeId.value) return
  enrolling.value = true
  try {
    await api.post('/biometric/enroll', { employee_id: selectedEmployeeId.value })
    message.success('Employee sent to device successfully!')
    showEnrollModal.value = false
    selectedEmployeeId.value = null
    await fetchAllEmployees()
  } catch (err: any) {
    message.error(err?.data?.message || 'Failed to send to device')
  } finally {
    enrolling.value = false
  }
}

// Resend
const resendToDevice = (record: any) => {
  Modal.confirm({
    title: 'Resend to Device?',
    content: `Resend ${record.first_name} ${record.last_name} for fingerprint enrollment?`,
    okText: 'Resend',
    async onOk() {
      try {
        await api.post('/biometric/enroll', { employee_id: record.id })
        message.success('Resent successfully!')
        await fetchAllEmployees()
      } catch {
        message.error('Failed to resend')
      }
    }
  })
}

// Send never-sent employee
const sendToDevice = (record: any) => {
  Modal.confirm({
    title: 'Send to Biometric Device?',
    content: `Send ${record.first_name} ${record.last_name} to the device?`,
    okText: 'Send',
    async onOk() {
      try {
        await api.post('/biometric/enroll', { employee_id: record.id })
        message.success('Sent successfully!')
        await fetchAllEmployees()
      } catch {
        message.error('Failed to send')
      }
    }
  })
}

// Reset
const confirmReset = (record: any) => {
  Modal.confirm({
    title: 'Reset Fingerprint?',
    content: `This will permanently remove ${record.first_name}'s fingerprint.`,
    okType: 'danger',
    okText: 'Reset',
    onOk() {
      // Implement reset endpoint later
      message.success('Fingerprint reset (implement endpoint)')
      fetchAllEmployees()
    }
  })
}

const columns = [
  { title: '#', key: 'index', width: 80, fixed: 'left' },
  { title: 'Employee', key: 'employee', width: 380 },
  { title: 'Code', key: 'code', width: 160 },
  { title: 'Biometric Status', key: 'status', width: 260 },
  { title: 'Actions', key: 'actions', width: 200, fixed: 'right' },
]

onMounted(fetchAllEmployees)
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background-color: #f8fafc !important;
  font-weight: 700;
  color: #1e293b;
  font-size: 0.95rem;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f0f9ff !important;
  transition: background-color 0.2s;
}

:deep(.ant-table-row) {
  transition: all 0.2s;
}
</style>