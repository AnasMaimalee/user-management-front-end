<template>
  <div class="min-h-screen flex flex-col">
    Test
  </div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
console.log('AUTH STORE:', auth)
</script>
