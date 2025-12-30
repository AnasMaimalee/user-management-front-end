<template>
  <div v-if="chat.typingUser" class="text-xs text-gray-400 px-4 py-1">
    {{ chat.typingUser }} is typing...
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '@/stores/chat'
const chat = useChatStore()
</script>
