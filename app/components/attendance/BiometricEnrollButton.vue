<script setup lang="ts">
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useBiometricEnrollmentService } from '~/composables/services/useBiometricEnrollmentService'

const props = defineProps<{
  employeeId: string
  biometricUid?: string | null
}>()

const loading = ref(false)
const { enroll } = useBiometricEnrollmentService()

const isEnrolled = computed(() => !!props.biometricUid)

const handleEnroll = async () => {
  loading.value = true

  const { error } = await enroll(props.employeeId)

  loading.value = false

  if (error.value) {
    message.error(error.value.data?.message || 'Enrollment failed')
    return
  }

  message.success(
    'Employee sent to biometric device. Ask employee to scan fingerprint.'
  )
}
</script>

<template>
  <a-button
    v-if="!isEnrolled"
    type="primary"
    :loading="loading"
    @click="handleEnroll"
  >
    Enroll Biometrics
  </a-button>

  <a-tag v-else color="green">
    Enrolled
  </a-tag>
</template>
