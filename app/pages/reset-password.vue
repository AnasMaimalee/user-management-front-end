<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
  layout: false,
  ssr: false
})

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref('')

const formState = reactive({
  password: '',
  password_confirmation: ''
})

// Get token & email from query params
const token = computed(() => route.query.token)
const email = computed(() => route.query.email)

const canSubmit = computed(() =>
  formState.password.length >= 6 &&
  formState.password === formState.password_confirmation
)

const submit = async () => {
  if (!canSubmit.value) {
    errorMessage.value = 'Passwords must match and be at least 6 characters.'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    await api.post('/reset-password', {
      token: token.value,
      email: email.value,
      password: formState.password,
      password_confirmation: formState.password_confirmation
    })

    notification.success({
      message: 'Password Reset Successful',
      description: 'You can now login with your new password.',
      placement: 'topRight'
    })

    router.push('/login')
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || 'Failed to reset password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex justify-center items-center bg-gradient-to-r from-slate-50 to-indigo-50 p-4">
    <div class="w-full max-w-md p-6 rounded-xl shadow-xl bg-white border border-slate-200">
      <h2 class="text-2xl font-bold text-center text-primary mb-4">Reset Password</h2>
      <p class="text-gray-500 text-center mb-6">Enter your new password below.</p>

      <div class="space-y-4">
        <a-form-item label="New Password" :validate-status="errorMessage ? 'error' : ''" :help="errorMessage">
          <a-input-password
            v-model:value="formState.password"
            placeholder="Enter new password"
            size="large"
          />
        </a-form-item>

        <a-form-item label="Confirm Password">
          <a-input-password
            v-model:value="formState.password_confirmation"
            placeholder="Confirm new password"
            size="large"
          />
        </a-form-item>

        <a-button
          type="primary"
          class="w-full"
          size="large"
          :loading="loading"
          :disabled="!canSubmit"
          @click="submit"
        >
          Reset Password
        </a-button>
      </div>

      <div class="text-center mt-4">
        <router-link to="/login" class="text-primary hover:underline font-medium">
          Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-primary {
  color: #4f46e5; /* Indigo-600 */
}
</style>
