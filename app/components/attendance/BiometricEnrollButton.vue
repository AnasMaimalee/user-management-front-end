<!-- components/attendance/biometric/BiometricEnrollButton.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import api from '~/utils/api'

const props = defineProps<{
  employeeId: string
}>()

const emit = defineEmits(['success'])

const loading = ref(false)

const enroll = () => {
  Modal.confirm({
    title: 'Enroll Employee Biometric',
    content: 'Make sure the employee is physically present at the biometric device.',
    okText: 'Start Enrollment',
    cancelText: 'Cancel',
    okButtonProps: { type: 'primary' },
    async onOk() {
      if (!props.employeeId) {
        message.error('Employee ID is missing')
        return
      }

      loading.value = true
      try {
        await api.post('/biometric/enroll', {
          employee_id: props.employeeId
        })

        message.success('Biometric enrollment started successfully!')
        emit('success')
      } catch (err: any) {
        console.error('Biometric enrollment failed:', err)
        const msg = err?.data?.message || err?.message || 'Enrollment failed. Please try again.'
        message.error(msg)
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
    :loading="loading"
    @click="enroll"
  >
    Enroll Biometric
  </a-button>
</template>