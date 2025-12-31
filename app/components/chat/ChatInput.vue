<template>
  <div class="bg-[#f0f0f0] px-3 py-3 flex items-center gap-2">
    <a-input
      v-model:value="message"
      @input="onTyping"
      @press-enter="sendMessage"
      placeholder="Type a message"
      class="flex-1 bg-white rounded-full"
      size="large"
    />

    <a-button
      type="primary"
      shape="circle"
      size="large"
      :disabled="!message.trim()"
      @click="sendMessage"
      class="bg-[#075e54]"
    >
      <send-outlined />
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { useChatStore } from '~/stores/chat'
import { SendOutlined } from '@ant-design/icons-vue'

const chat = useChatStore()
const message = ref('')

let typingTimeout: any = null

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
  document.querySelector('.overflow-y-auto')?.scrollTo({ top: document.querySelector('.overflow-y-auto')?.scrollHeight, behavior: 'smooth' })
}
</script>

<style scoped>
:deep(.ant-input) {
  height: 46px;
  border-radius: 9999px;
  padding-left: 20px;
  padding-right: 20px;
}
</style>