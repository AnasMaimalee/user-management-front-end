<script setup lang="ts">
import { ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import api from '~/utils/api'

const props = defineProps<{
  employeeId: string | null
}>()

const emit = defineEmits(['success'])

const loading = ref(false)

// GET SECRET FROM .env
const biometricSecret = import.meta.env.VITE_BIOMETRIC_SECRET

const enroll = () => {
  if (!props.employeeId) {
    message.warning('Please select an employee')
    return
  }

  Modal.confirm({
    title: 'Enroll Employee Biometric',
    content: 'Make sure the employee is physically present at the biometric device.',
    okText: 'Start Enrollment',
    cancelText: 'Cancel',
    okButtonProps: { type: 'primary' },
    async onOk() {
      loading.value = true
      try {
        await api.post('/biometric/enroll', {
          employee_id: props.employeeId,
          biometric_secret: biometricSecret  // ← THIS WAS MISSING!
        })
console.log(biometricSecret, "Biometric")

        message.success('Biometric enrollment started successfully!')
        emit('success')
      } catch (err: any) {
        const msg = err?.data?.message || 'Enrollment failed'
        if (msg.includes('biometric secret')) {
          message.error('Security error: Invalid or missing biometric secret')
        } else {
          message.error(msg)
        }
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <a-button
    type="primary"
    size="large"
    :loading="loading"
    :disabled="!props.employeeId"
    @click="enroll"
  >
    Enroll Biometric
  </a-button>
</template>