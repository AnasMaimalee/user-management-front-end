<script setup lang="ts">
import { ref } from 'vue'
import { message, Modal } from 'ant-design-vue'

const props = defineProps<{
  employeeId: string
}>()

const emit = defineEmits(['success'])
const loading = ref(false)

const reset = async () => {
  Modal.confirm({
    title: 'Reset Biometric Enrollment',
    content: 'This will remove existing biometric data. Continue?',
    okType: 'danger',
    async onOk() {
      loading.value = true
      try {
        await $fetch(`/api/biometric/reset`, {
          method: 'POST',
          body: { employee_id: props.employeeId }
        })

        message.success('Biometric enrollment reset')
        emit('success')
      } catch (e: any) {
        message.error(e?.data?.message || 'Reset failed')
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<template>
  <a-button
    danger
    :loading="loading"
    @click="reset"
  >
    Reset Enrollment
  </a-button>
</template>
