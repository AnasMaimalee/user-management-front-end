<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useAttendanceStats } from '~/composables/useAttendanceStats'

const { stats, loading, fetchStats } = useAttendanceStats()

onMounted(fetchStats)

const present = computed(() => stats.value?.present ?? 0)
const absent = computed(() => stats.value?.absent ?? 0)
const late = computed(() => stats.value?.late ?? 0)
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
    <AttendanceStatCard
      title="Present Today"
      :value="present"
      color="#16a34a"
    />

    <AttendanceStatCard
      title="Absent Today"
      :value="absent"
      color="#dc2626"
    />

    <AttendanceStatCard
      title="Late"
      :value="late"
      color="#ca8a04"
    />
  </div>
</template>
