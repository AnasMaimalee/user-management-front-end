import { defineStore } from 'pinia'
import api from '~/utils/api'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [] as any[],
    loading: false,
  }),

  actions: {
    async fetchMessages() {
      this.loading = true
      try {
        const res = await api.get('/chat/messages')
        this.messages = res.data.messages
      } finally {
        this.loading = false
      }
    },

    async sendMessage(message: string) {
      if (!message.trim()) return

      const res = await api.post('/chat/messages', { message })
      this.messages.push(res.data.message)
    },

    async markAsSeen() {
    await api.post('/chat/seen')
    },

    typingUser: null as string | null,


    async sendTyping(typing: boolean) {
    await api.post('/chat/typing', { typing })
    },

  },
})
