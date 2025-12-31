<template>
  <div class="h-full overflow-y-auto px-3 py-4 space-y-2 bg-[url('/whatsapp-bg.png')] bg-repeat bg-gray-100">
    <div
      v-for="msg in chat.messages"
      :key="msg.id"
      :class="[
        'flex max-w-[75%]',
        isOwnMessage(msg) ? 'ml-auto' : 'mr-auto'
      ]"
    >
      <div
        :class="[
          'px-4 py-2 rounded-2xl relative',
          isOwnMessage(msg)
            ? 'bg-[#dcf8c6] rounded-tr-none' 
            : 'bg-white rounded-tl-none shadow-sm'
        ]"
      >
        <!-- Sender name only for incoming -->
        <p v-if="!isOwnMessage(msg)" class="text-xs font-medium text-[#075e54] mb-1">
          {{ senderName(msg) }}
        </p>

        <p class="text-base">{{ msg.message }}</p>

        <!-- Time + Status (bottom right) -->
        <div class="flex items-center justify-end gap-1 mt-1">
          <span class="text-xs text-gray-500">{{ formatTime(msg.created_at) }}</span>
          <span v-if="isOwnMessage(msg)" class="text-xs">
            <span class="text-blue-600">{{ msg.seen_at ? '✓✓' : '✓' }}</span>
          </span>
        </div>

        <!-- Tail (WhatsApp-style) -->
        <div
          :class="[
            'absolute w-3 h-3 bottom-0',
            isOwnMessage(msg)
              ? 'right-0 bg-[#dcf8c6] -mr-1 rotate-45 translate-x-1/2'
              : 'left-0 bg-white -ml-1 -rotate-45 -translate-x-1/2'
          ]"
        />
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!chat.messages.length" class="text-center text-gray-500 mt-20">
      <p class="text-lg">No messages yet</p>
      <p class="text-sm">Start the conversation!</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useChatStore } from '~/stores/chat'
import { useAuthStore } from '~/stores/auth'

const chat = useChatStore()
const auth = useAuthStore()

const isOwnMessage = (msg: any) => {
  const userId = auth.user?.id
  return userId && (msg.user?.id === userId || msg.employee?.user_id === userId)
}

const senderName = (msg: any) => {
  if (msg.user) return msg.user.name
  if (msg.employee) return `${msg.employee.first_name} ${msg.employee.last_name}`
  return 'Unknown'
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
/* Hide scrollbar */
.h-full { scrollbar-width: none; }
.h-full::-webkit-scrollbar { display: none; }
</style>