<template>
  <div class="h-full flex flex-col bg-white rounded-xl shadow">
    <!-- Header -->
    <div class="px-6 py-4 border-b">
      <h2 class="text-xl font-semibold text-gray-800">Company Chat</h2>
      <p class="text-sm text-gray-500">All employees & admins</p>
    </div>

    <!-- Messages -->
    <ChatMessages />

    <!-- Input -->
    <ChatInput />

    <ChatTypingIndicator />

  </div>
</template>

<script setup lang="ts">
import ChatMessages from '~/components/chat/ChatMessages.vue'
import ChatInput from '~/components/chat/ChatInput.vue'

onMounted(() => {
  chat.markAsSeen()
})

</script>
