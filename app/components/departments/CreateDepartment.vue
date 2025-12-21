<template>
  <a-modal
    v-model:open="localOpen"
    title="Create Department"
    @cancel="handleClose"
    @ok="submit"
  >
    <a-form layout="vertical">
      <a-form-item label="Name">
        <a-input v-model:value="name" />
      </a-form-item>

      <a-form-item label="Description">
        <a-textarea v-model:value="description" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits(['close', 'created'])

const localOpen = ref(false)
const name = ref('')
const description = ref('')

watch(
  () => props.open,
  (val) => (localOpen.value = val)
)

const handleClose = () => {
  emit('close')
}

const submit = async () => {
  if (!name.value.trim()) return

  await api.post('/departments', {
    name: name.value,
    description: description.value,
  })

  notification.success({ message: 'Department created' })
  emit('created')
  emit('close')

  name.value = ''
  description.value = ''
}
</script>
