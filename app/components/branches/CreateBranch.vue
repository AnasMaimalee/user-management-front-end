<template>
  <a-modal
    v-model:open="localOpen"
    title="Create Branch"
    @cancel="handleClose"
    @ok="submit"
    :confirm-loading="submitting"
  >
    <a-form layout="vertical">
      <a-form-item label="Branch Name" required>
        <a-input v-model:value="name" placeholder="e.g., Kano Main Branch" />
      </a-form-item>

      <a-form-item label="State" required>
        <a-input v-model:value="state" placeholder="e.g., Kano" />
      </a-form-item>

      <a-form-item label="Country">
        <a-input v-model:value="country" placeholder="Nigeria" disabled />
      </a-form-item>

      <a-form-item label="Status">
        <a-select v-model:value="status">
          <a-select-option value="active">Active</a-select-option>
          <a-select-option value="inactive">Inactive</a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits(['close', 'created'])

const localOpen = ref(false)
const submitting = ref(false)
const name = ref('')
const state = ref('')
const country = ref('Nigeria')
const status = ref<'active' | 'inactive'>('active')

watch(() => props.open, (val) => localOpen.value = val)

const handleClose = () => {
  emit('close')
  name.value = ''
  state.value = ''
  status.value = 'active'
}

const submit = async () => {
  if (!name.value.trim() || !state.value.trim()) {
    notification.error({ message: 'Branch name and state are required' })
    return
  }

  submitting.value = true
  try {
    await api.post('/branches', {
      name: name.value.trim(),
      state: state.value.trim(),
      country: country.value,
      status: status.value,
    })

    notification.success({ message: 'Branch created successfully' })
    emit('created')
    emit('close')
    handleClose()
  } catch (err: any) {
    notification.error({
      message: 'Failed to create branch',
      description: err.response?.data?.message || 'Please try again',
    })
  } finally {
    submitting.value = false
  }
}
</script>