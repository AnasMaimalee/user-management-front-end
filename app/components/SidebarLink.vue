<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-3 px-3 py-2 rounded
           hover:bg-slate-800 transition text-sm"
  >
    <span class="text-lg">{{ icon }}</span>
    <span v-if="!collapsed" class="whitespace-nowrap">
      {{ label }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{
  to: string
  icon: string
  label: string
  collapsed: boolean
}>()
</script>
