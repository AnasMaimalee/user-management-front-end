<template>
  <div class="bg-white p-6 rounded-lg shadow">
    <h2 class="text-lg font-semibold mb-4">Request Leave</h2>

    <form @submit.prevent="submit">
      <div class="space-y-4">

        <textarea
          v-model="form.reason"
          placeholder="Reason for leave"
          class="w-full border rounded p-2"
          required
        />

        <div class="grid grid-cols-2 gap-4">
          <input type="date" v-model="form.start_date" class="border p-2 rounded" />
          <input type="date" v-model="form.end_date" class="border p-2 rounded" />
        </div>

        <input
          type="date"
          v-model="form.resume_date"
          class="border p-2 rounded w-full"
        />

        <button
          class="bg-blue-600 text-white px-4 py-2 rounded"
          :disabled="loading"
        >
          {{ loading ? 'Submitting...' : 'Submit Request' }}
        </button>
      </div>
    </form>
  </div>
</template>
<script setup lang="ts">
import { reactive, ref } from 'vue'
import api from '~/utils/api'
import { message } from 'ant-design-vue'

defineProps<{ open: boolean }>()
const emit = defineEmits(['close', 'created'])

const loading = ref(false)

const form = reactive({
  start_date: '',
  end_date: '',
  resume_date: '',
  reason: '',
})

const submit = async () => {
  loading.value = true
  try {
    await api.post('/leaves', form)
    message.success('Leave request submitted')
    emit('created')
    emit('close')
  } finally {
    loading.value = false
  }
}
</script>
