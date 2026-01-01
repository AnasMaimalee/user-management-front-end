<script setup lang="ts">
import { ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import api from '~/utils/api'

console.log('Secret from .env:', import.meta.env.VITE_BIOMETRIC_SECRET)

const open = ref(false)
const loading = ref(false)
const employees = ref<any[]>([])
const selectedEmployeeId = ref<string | null>(null)

const biometricSecret = import.meta.env.VITE_BIOMETRIC_SECRET

const fetchEmployees = async () => {
  loading.value = true
  try {
    const res = await api.get('/employees')
    employees.value = res.data.filter((emp: any) => 
      emp.device_user_id || emp.fingerprint_enrolled_at
    )
  } catch (err: any) {
    message.error(err.response?.data?.message || 'Failed to load employees')
  } finally {
    loading.value = false
  }
}

const openModal = async () => {
  open.value = true
  selectedEmployeeId.value = null
  await fetchEmployees()
}

const resetBiometric = async () => {
  if (!selectedEmployeeId.value) {
    message.warning('Please select an employee')
    return
  }

  loading.value = true
  try {
    await api.post('/admin/biometric/reset', {
      employee_id: selectedEmployeeId.value,
      biometric_secret: biometricSecret,
    })

    message.success('Biometric fingerprint reset successfully!')
    open.value = false
  } catch (err: any) {
    const msg = err.response?.data?.message || 'Reset failed'
    if (msg.includes('Invalid biometric secret')) {
      message.error('Security error: Invalid secret key')
    } else {
      message.error(msg)
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <a-button danger @click="openModal">
    Reset Biometric Fingerprint
  </a-button>

  <a-modal
    v-model:open="open"
    title="Reset Employee Biometric Fingerprint"
    width="600"
    centered
    :confirm-loading="loading"
    ok-text="Reset Fingerprint"
    ok-type="danger"
    @ok="resetBiometric"
  >
    <div class="space-y-4">
      <a-alert
        type="warning"
        message="This action is permanent and cannot be undone"
        banner
        class="mb-6"
      />

      <p class="text-red-600 font-medium">
        ⚠️ This will completely remove the employee's fingerprint from the system and device.
      </p>

      <a-select
        v-model:value="selectedEmployeeId"
        placeholder="Select employee to reset"
        show-search
        :filter-option="(input, option) => option.label.toLowerCase().includes(input.toLowerCase())"
        class="w-full"
        size="large"
      >
        <a-select-option
          v-for="emp in employees"
          :key="emp.id"
          :value="emp.id"
          :label="`${emp.first_name} ${emp.last_name} (${emp.employee_code})`"
        >
          <div class="flex justify-between">
            <span>{{ emp.first_name }} {{ emp.last_name }}</span>
            <span class="text-xs text-slate-500">{{ emp.employee_code }}</span>
          </div>
        </a-select-option>
      </a-select>
    </div>
  </a-modal>
</template>