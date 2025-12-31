<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  color?: string
}>()
</script>

<template>
  <a-card>
    <a-statistic
      :title="title"
      :value="value"
      :value-style="{ color }"
    />
  </a-card>
</template>
