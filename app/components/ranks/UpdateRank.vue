<template>
  <a-modal
    v-model:open="localOpen"
    title="Update Rank"
    @cancel="handleClose"
    @ok="submit"
    :confirm-loading="submitting"
  >
    <a-form layout="vertical">
      <a-form-item label="Rank Name" required>
        <a-input v-model:value="name" placeholder="e.g., Senior Developer" />
      </a-form-item>

      <a-form-item label="Priority" required>
        <a-input-number v-model:value="priority" :min="1" :max="10" style="width: 100%" />
        <div class="text-xs text-slate-500 mt-1">Lower number = higher priority</div>
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
  rank: {
    id: string
    name: string
    priority: string | number
    status: string
  } | null
}>()

const emit = defineEmits(['close', 'updated'])

const localOpen = ref(false)
const submitting = ref(false)
const name = ref('')
const priority = ref<number | null>(null)
const status = ref<'active' | 'inactive'>('active')

watch(() => props.open, (val) => {
  localOpen.value = val
  if (val && props.rank) {
    name.value = props.rank.name
    priority.value = Number(props.rank.priority)
    status.value = props.rank.status as 'active' | 'inactive'
  }
})

const handleClose = () => {
  emit('close')
}

const submit = async () => {
  if (!name.value.trim()) {
    notification.error({ message: 'Rank name is required' })
    return
  }
  if (!priority.value) {
    notification.error({ message: 'Priority is required' })
    return
  }

  submitting.value = true
  try {
    await api.put(`/ranks/${props.rank?.id}`, {
      name: name.value.trim(),
      priority: priority.value,
      status: status.value,
    })

    notification.success({ message: 'Rank updated successfully' })
    emit('updated')
    emit('close')
  } catch (err: any) {
    notification.error({
      message: 'Failed to update rank',
      description: err.response?.data?.message || 'Please try again',
    })
  } finally {
    submitting.value = false
  }
}
</script>