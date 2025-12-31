<!-- app/components/ui/StatCard.vue -->
<script setup lang="ts">
const props = defineProps<{
  title: string
  value: string | number
  color?: string
  icon?: string
}>()
</script>

<template>
  <div class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
    <p class="text-sm font-medium text-slate-500 uppercase tracking-wide mb-2">
      {{ title }}
    </p>
    <p class="text-3xl font-bold mt-3" :class="color">
      {{ value }}
    </p>
    <div v-if="icon" class="text-5xl opacity-20 mt-4" :class="color">
      {{ icon }}
    </div>
  </div>
</template>