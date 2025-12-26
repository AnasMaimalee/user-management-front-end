<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">Leave Requests</h2>

    <div v-for="leave in leaves" :key="leave.id" class="bg-white p-4 border rounded">
      <div class="flex justify-between">
        <div>
          <p class="font-semibold">{{ leave.employee?.name }}</p>
          <p class="text-sm text-gray-500">
            {{ leave.start_date }} → {{ leave.end_date }}
          </p>
        </div>

        <span :class="statusClass(leave.status)" class="px-3 py-1 rounded text-sm">
          {{ leave.status }}
        </span>
      </div>

      <p class="mt-2">{{ leave.reason }}</p>

      <div v-if="leave.status === 'pending'" class="mt-3 flex gap-2">
        <button @click="approve(leave.id)" class="bg-green-600 text-white px-3 py-1 rounded">
          Approve
        </button>
        <button @click="reject(leave.id)" class="bg-red-600 text-white px-3 py-1 rounded">
          Reject
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const leaves = ref<any[]>([])
const loading = ref(false)

const { $api } = useNuxtApp()

const fetchLeaves = async () => {
  loading.value = true
  try {
    const { data } = await $api.get('/leaves')
    leaves.value = data
  } finally {
    loading.value = false
  }
}

const approve = async (id: string) => {
  await $api.patch(`/leaves/${id}`, { status: 'approved' })
  fetchLeaves()
}

const reject = async (id: string) => {
  const note = prompt('Reason for rejection?') || ''
  await $api.patch(`/leaves/${id}`, {
    status: 'rejected',
    admin_note: note
  })
  fetchLeaves()
}

onMounted(fetchLeaves)
</script>
