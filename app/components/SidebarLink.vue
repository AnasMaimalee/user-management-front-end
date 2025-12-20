<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium
           text-white/80 hover:text-white
           hover:bg-blue-500 dark:hover:bg-slate-800 transition"
  >
    <span class="text-lg">{{ icon }}</span>
    <span v-if="!collapsed">{{ label }}</span>
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
