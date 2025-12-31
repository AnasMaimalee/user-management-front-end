<script setup lang="ts">
import { ref } from 'vue'
import { message, Modal } from 'ant-design-vue'

const props = defineProps<{
  employeeId: string
}>()

const emit = defineEmits(['success'])

const loading = ref(false)

const enroll = async () => {
  Modal.confirm({
    title: 'Enroll Employee',
    content: 'Make sure the employee is physically present at the biometric device.',
    okText: 'Start Enrollment',
    cancelText: 'Cancel',
    async onOk() {
      loading.value = true
      try {
        await $fetch('/api/biometric/enroll', {
          method: 'POST',
          body: { employee_id: props.employeeId },
          headers: {
            // Ensure auth if needed
            Authorization: `Bearer ${useCookie('auth_token').value || ''}`
          }
        })

        message.success('Enrollment started successfully')
        emit('success')
      } catch (err: any) {
        console.error('Enrollment error:', err)
        const msg = err?.data?.message || err?.message || 'Enrollment failed. Please try again.'
        message.error(msg)
      } finally {
        loading.value = false
      }
    },
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

    :disabled="!props.employeeId"
