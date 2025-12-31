<script setup lang="ts">
import { ref } from 'vue'
import { useAdminAttendanceService } from '@/services/admin-attendance.service'

const service = useAdminAttendanceService()
const range = ref<any[]>([])

const emit = defineEmits(['update'])

const apply = async () => {
  const [from, to] = range.value
  const res = await service.report(from, to)
  emit('update', res.data.value)
}
</script>

<template>
  <a-space>
    <a-range-picker v-model:value="range" />
    <a-button type="primary" @click="apply">
      Apply
    </a-button>
  </a-space>
</template>
