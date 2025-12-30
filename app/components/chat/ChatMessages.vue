<template>
  <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
    <div
      v-for="msg in chat.messages"
      :key="msg.id"
      class="flex gap-3"
    >
      <a-avatar style="background:#1677ff">
        {{ senderInitial(msg) }}
      </a-avatar>

      <div>
        <p class="font-medium text-gray-800">
          {{ senderName(msg) }}
        </p>
        <p class="text-gray-700">
          {{ msg.message }}
        </p>
        <p class="text-xs text-gray-400 mt-1">
          {{ new Date(msg.created_at).toLocaleTimeString() }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useChatStore } from '~/stores/chat'

const chat = useChatStore()

onMounted(() => {
  chat.fetchMessages()
})

const senderName = (msg: any) => {
  if (msg.user) return msg.user.name
  if (msg.employee) return `${msg.employee.first_name} ${msg.employee.last_name}`
  return 'Unknown'
}

const senderInitial = (msg: any) => {
  return senderName(msg).charAt(0).toUpperCase()
}

$echo.channel('company-chat')
  .listen('.chat.message.seen', (e: any) => {
    const msg = chat.messages.find(m => m.id === e.message.id)
    if (msg) {
      msg.seen_at = e.message.seen_at
    }
  })

</script>
