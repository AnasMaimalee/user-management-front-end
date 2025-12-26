<template>
  <div class="space-y-4">
    <h2 class="text-xl font-semibold">My Leave Requests</h2>

    <div v-for="leave in leaves" :key="leave.id" class="bg-white p-4 rounded border">
      <p class="font-medium">{{ leave.reason }}</p>
      <p class="text-sm text-gray-500">
        {{ leave.start_date }} → {{ leave.end_date }}
      </p>

      <span
        class="inline-block mt-2 px-3 py-1 rounded text-sm"
        :class="statusClass(leave.status)"
      >
        {{ leave.status }}
      </span>

      <p v-if="leave.admin_note" class="mt-2 text-sm text-gray-600">
        <strong>Admin Note:</strong> {{ leave.admin_note }}
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const leaves = ref<any[]>([])
const loading = ref(false)

const { $api } = useNuxtApp()

const fetchMyLeaves = async () => {
  loading.value = true
  try {
    const { data } = await $api.get('/leaves/my')
    leaves.value = data
  } finally {
    loading.value = false
  }
}

onMounted(fetchMyLeaves)
</script>
