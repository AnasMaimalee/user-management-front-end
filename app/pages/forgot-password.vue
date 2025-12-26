<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

definePageMeta({
  layout: 'auth',
  ssr: false
})

// Loading state
const loading = ref(false)

// Error message under the input
const errorMessage = ref('')

// Form data
const formState = reactive({
  email: ''
})

// Validate email with regex
const isValidEmail = computed(() => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(formState.email)
})

// Submit handler
const submit = async () => {
  if (!isValidEmail.value) return // safety check
  loading.value = true
  errorMessage.value = ''
  console.log('Submitting forgot-password') // For debugging

  try {
    await api.post('/forgot-password', { email: formState.email })

    notification.success({
      message: 'Email Sent',
      description: 'A password reset link has been sent to your email.',
      placement: 'topRight',
      duration: 4
    })

    // Clear the email field optionally
    formState.email = ''
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to send reset link'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="min-h-screen flex justify-center items-center
           bg-gradient-to-r from-slate-50 to-indigo-50"
  >
    <div
      class="w-full md:w-1/3 p-6 rounded-xl shadow-xl
             bg-white border border-slate-200"
    >
      <!-- Title -->
      <h2 class="text-2xl font-bold text-center text-primary mb-4">
        Forgot Password
      </h2>
      <p class="text-gray-500 text-center mb-6">
        Enter your email to receive a password reset link.
      </p>

      <!-- Form -->
      <a-form layout="vertical" @submit.prevent="submit" class="space-y-4">
        <a-form-item
          label="Email"
          :validate-status="errorMessage ? 'error' : ''"
          :help="errorMessage"
        >
          <a-input
            v-model:value="formState.email"
            type="email"
            placeholder="Enter your email"
            size="large"
            autocomplete="email"
          />
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
            :disabled="!isValidEmail"
            class="w-full"
            size="large"
          >
            Send Reset Link
          </a-button>
        </a-form-item>
      </a-form>

      <!-- Back to login -->
      <div class="text-center mt-4">
        <router-link
          to="/login"
          class="text-primary hover:underline font-medium"
        >
          Back to Login
        </router-link>
      </div>
    </div>

    <!-- Loader overlay -->
    <div
      v-if="loading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm"
    >
      <a-spin size="large" tip="Sending reset link..." />
    </div>
  </div>
</template>
