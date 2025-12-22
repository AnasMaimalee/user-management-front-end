<template>
  <a-modal
    v-model:open="localOpen"
    title="Update Branch"
    @cancel="handleClose"
    @ok="submit"
    :confirm-loading="submitting"
    width="600px"
  >
    <a-form layout="vertical">
      <a-form-item label="Branch Name" required>
        <a-input v-model:value="name" placeholder="e.g., Kano Main Branch" />
      </a-form-item>

      <a-form-item label="State" required>
        <a-input v-model:value="state" placeholder="e.g., Kano" />
      </a-form-item>

      <a-form-item label="Country">
        <a-input :value="country" disabled />
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
import { ref, watch } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

const props = defineProps<{
  open: boolean
  branch: {
    id: string
    name: string
    state: string
    country: string
    status: 'active' | 'inactive'
  } | null
}>()

const emit = defineEmits(['close', 'updated'])

const localOpen = ref(false)
const submitting = ref(false)
const name = ref('')
const state = ref('')
const country = ref('Nigeria')
const status = ref<'active' | 'inactive'>('active')

watch(
  () => [props.open, props.branch],
  ([isOpen, currentBranch]) => {
    localOpen.value = isOpen
    if (isOpen && currentBranch) {
      name.value = currentBranch.name || ''
      state.value = currentBranch.state || ''
      country.value = currentBranch.country || 'Nigeria'
      status.value = currentBranch.status || 'inactive'
    }
  },
  { immediate: true }
)

const handleClose = () => {
  emit('close')
  name.value = ''
  state.value = ''
  status.value = 'active'
}

const submit = async () => {
  if (!props.branch?.id) {
    notification.error({ message: 'No branch selected' })
    return
  }

  if (!name.value.trim() || !state.value.trim()) {
    notification.error({ message: 'Branch name and state are required' })
    return
  }

  const payload = {
    name: name.value.trim(),
    state: state.value.trim(),
    country: country.value,
    status: status.value,
  }

  console.log('Sending update payload:', payload)

  submitting.value = true

  try {
    const response = await api.put(`/branches/${props.branch.id}`, payload)
    console.log('Update success:', response.data)

    notification.success({ message: 'Branch updated successfully' })
    emit('updated', response.data || { ...props.branch, ...payload })
    emit('close')
    handleClose()
  } catch (err: any) {
    console.error('Update error details:', err)
    console.error('Response:', err.response?.data)

    notification.error({
      message: 'Failed to update branch',
      description: err.response?.data?.message || 'Server error - check console',
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.ant-form-item {
  margin-bottom: 20px;
}
</style>