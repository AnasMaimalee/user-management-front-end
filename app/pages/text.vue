<template>
  <div class="">
    <div class="mt-5">
      Test
    <a-button type="primary">
      Submit
    </a-button>
<a-space>
      <a-button type="primary" ghost>Primary</a-button>
      <a-button ghost>Default</a-button>
      <a-button type="dashed" ghost>Dashed</a-button>
      <a-button type="primary" danger ghost>Danger</a-button>
    </a-space>
    </div>
  </div>
  
</template>

<script setup>
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
console.log('AUTH STORE:', auth)
</script>
