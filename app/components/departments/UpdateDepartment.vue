<template>
  <a-modal
    title="Update Department"
    :open="open"
    @ok="updateDepartment"
    @cancel="$emit('close')"
    :confirm-loading="loading"
  >
    <a-form layout="vertical">
      <a-form-item label="Department Name">
        <a-input v-model:value="form.name" />
      </a-form-item>

      <a-form-item label="Description">
        <a-textarea v-model:value="form.description" rows="3" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '~/utils/api'
import { message } from 'ant-design-vue'

const props = defineProps({
  open: Boolean,
  department: Object,
})

const emit = defineEmits(['close', 'updated'])

const loading = ref(false)
const form = ref({
  name: '',
  description: '',
})

watch(
  () => props.department,
  (val: any) => {
    if (val) {
      form.value.name = val.name
      form.value.description = val.description
    }
  },
  { immediate: true }
)

const updateDepartment = async () => {
  loading.value = true
  try {
    await api.put(`/departments/${props.department?.id}`, form.value)
    message.success('Department updated')
    emit('updated')
    emit('close')
  } finally {
    loading.value = false
  }
}
</script>
