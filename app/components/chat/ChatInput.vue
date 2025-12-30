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
    <a-input
        v-model:value="message"
        @input="onTyping"
        placeholder="Type a message..."
        />

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

let typingTimeout: any = null

const onTyping = () => {
  chat.sendTyping(true)

  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => {
    chat.sendTyping(false)
  }, 1200)
}

</script>
