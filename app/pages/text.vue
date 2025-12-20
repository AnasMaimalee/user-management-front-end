<template>
  <div>Test</div>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
console.log('AUTH STORE:', auth)
</script>
