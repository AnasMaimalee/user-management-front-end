<template>
  <div class="min-h-screen flex justify-center items-center bg-gradient-to-r from-slate-50 to-indigo-50">
    <slot />
  </div>
</template>

<script setup lang="ts">
// This layout is completely clean — no sidebar, no header, no footer
</script>

<style scoped>
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}
</style>
