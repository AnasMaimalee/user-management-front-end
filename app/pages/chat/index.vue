<!-- pages/chat.vue -->
<template>
  <div class="flex flex-col h-screen bg-gray-100">
    <!-- Messages Area -->
    <div class="flex-1 overflow-y-auto px-4 py-6 md:px-8 lg:px-32">
      <div class="max-w-5xl mx-auto space-y-4">
        <!-- Messages -->
        <div
          v-for="msg in chat.messages"
          :key="msg.id"
          :class="[
            'flex',
            isOwnMessage(msg) ? 'justify-end' : 'justify-start'
          ]"
        >
          <div
            :class="[
              'max-w-md px-5 py-3 rounded-2xl shadow-sm relative',
              isOwnMessage(msg)
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
            ]"
          >
            <!-- Sender name (only for incoming messages) -->
            <p v-if="!isOwnMessage(msg)" class="text-xs font-semibold text-gray-500 mb-2">
              {{ senderName(msg) }}
            </p>

            <!-- Message text -->
            <p class="text-base break-words">{{ msg.message }}</p>

            <!-- Time + Seen ticks -->
            <div class="flex items-center justify-end gap-2 mt-2">
              <span class="text-xs opacity-80">{{ formatTime(msg.created_at) }}</span>
              <span v-if="isOwnMessage(msg)" class="text-xs font-bold">
                {{ msg.seen_at ? '✓✓' : '✓' }}
              </span>
            </div>

            <!-- Tail triangle -->
            <div
              :class="[
                'absolute bottom-0 w-0 h-0 border-8 border-transparent',
                isOwnMessage(msg)
                  ? 'right-0 border-l-blue-600 translate-x-1/2 -mr-2'
                  : 'left-0 border-r-white translate-x-[-50%] -ml-2 border-r-gray-200'
              ]"
            />
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!chat.messages.length" class="text-center text-gray-500 py-20">
          <p class="text-xl font-medium">No messages yet</p>
          <p class="text-base mt-2">Start communicating with your team</p>
        </div>
      </div>
    </div>

    <!-- Input Bar -->
    <div class="bg-white border-t border-gray-200 px-4 py-4 md:px-8 lg:px-32">
      <div class="max-w-5xl mx-auto flex items-center gap-4">
        <a-input
          v-model:value="message"
          @input="onTyping"
          @press-enter="sendMessage"
          placeholder="Type a message..."
          class="flex-1 bg-gray-50 rounded-2xl border-gray-300 text-base"
          size="large"
        />

        <a-button
          type="primary"
          shape="circle"
          size="large"
          :disabled="!message.trim()"
          @click="sendMessage"
          class="bg-blue-600 hover:bg-blue-700 shadow-md"
        >
          <send-outlined />
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useChatStore } from '~/stores/chat'
import { useAuthStore } from '~/stores/auth'
import { SendOutlined } from '@ant-design/icons-vue'
const { $echo } = useNuxtApp()

onMounted(async () => {
  await chat.fetchMessages()
  await chat.markAsSeen()
  await nextTick()
  scrollToBottom()

  // Listen for new messages from other users
  $echo.channel('chat') // or 'private-chat' if private channel
    .listen('MessageSent', (e: any) => { // ← Replace 'MessageSent' with your actual event class name
      console.log('New live message received:', e)
      chat.addLiveMessage(e.message) // or e (depending on what your event broadcasts)

      // Auto scroll to bottom when someone else sends
      nextTick(() => scrollToBottom())
    })
})

// Optional: leave channel when leaving page
onUnmounted(() => {
  $echo.leaveChannel('chat')
})

const chat = useChatStore()
const auth = useAuthStore()

const message = ref('')

let typingTimeout: any = null

onMounted(async () => {
  await chat.fetchMessages()
  await chat.markAsSeen()

  await nextTick()
  scrollToBottom()
})

const onTyping = () => {
  chat.sendTyping(true)
  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => chat.sendTyping(false), 1200)
}

const sendMessage = async () => {
  const text = message.value.trim()
  if (!text) return

  await chat.sendMessage(text)
  message.value = ''

  await nextTick()
  scrollToBottom()
}

const scrollToBottom = () => {
  const container = document.querySelector('.overflow-y-auto')
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

const isOwnMessage = (msg: any) => {
  const currentUserId = auth.user?.id
  console.log('Current logged in user ID:', currentUserId)
  console.log('Message object:', msg)
  console.log('msg.user?.id:', msg.user?.id)
  console.log('msg.employee?.user_id:', msg.employee?.user_id)

  if (!currentUserId) return false

  const isFromUser = msg.user?.id === currentUserId
  const isFromEmployee = msg.employee?.user_id === currentUserId

  return isFromUser || isFromEmployee
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
:deep(.ant-input) {
  height: 52px;
  padding-left: 24px;
  padding-right: 24px;
  font-size: 16px;
}

.overflow-y-auto {
  scrollbar-width: none;
}
.overflow-y-auto::-webkit-scrollbar {
  display: none;
}
</style>