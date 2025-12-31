// stores/chat.ts
import { defineStore } from 'pinia'
import api from '~/utils/api'
import { useAuthStore } from '~/stores/auth'

export const useChatStore = defineStore('chat', {
  state: () => ({
    messages: [] as any[],
  }),

  actions: {
    async fetchMessages() {
      try {
        const res = await api.get('/chat/messages')
        this.messages = res.data.messages || []
      } catch (err) {
        console.error('Failed to fetch messages', err)
        this.messages = []
      }
    },

    async sendMessage(text: string) {
      const auth = useAuthStore()
      if (!auth.user) {
        console.error('No authenticated user')
        return
      }

      // Create temp message with correct structure
      const tempId = `temp-${Date.now()}`
      const tempMessage = {
        id: tempId,
        message: text,
        created_at: new Date().toISOString(),
        seen_at: null,
        // This fixes the jumping bug — match your backend structure
        user: {
          id: auth.user.id,
          name: auth.user.name || 'You',
        },
        // If employee sends, use this instead (uncomment if needed)
        // employee: { user_id: auth.user.id }
      }

      this.messages.push(tempMessage)

      try {
        const res = await api.post('/chat/messages', { message: text })
        const realMessage = res.data.message

        // Replace temp with real one
        const index = this.messages.findIndex(m => m.id === tempId)
        if (index !== -1) {
          this.messages[index] = realMessage
        }
      } catch (err) {
        console.error('Send failed', err)
        this.messages = this.messages.filter(m => m.id === tempId)
      }
    },

    addLiveMessage(message: any) {
      // Avoid duplicates from own temp message
      const exists = this.messages.some(m => m.id === message.id)
      if (!exists) {
        this.messages.push(message)
      }
    },

    async markAsSeen() {
      if (!this.messages.length) return

      try {
        await api.post('/chat/seen')
        this.messages = this.messages.map(m => ({
          ...m,
          seen_at: m.seen_at || new Date().toISOString(),
        }))
      } catch (err) {
        console.error('Failed to mark as seen', err)
      }
    },

    sendTyping(isTyping: boolean) {
      api.post('/chat/typing', { typing: isTyping }).catch(err => {
        console.error('Typing failed', err)
      })
    },
  },
})