<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'

definePageMeta({
  layout: false,
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
const token = computed(() => route.query.token as string)
const email = computed(() => route.query.email as string)

// Password Strength Calculation
const passwordStrength = computed(() => {
  const password = formState.password
  if (!password) return { score: 0, label: '', color: '' }

  let score = 0
  const checks = [
    password.length >= 8,                    // Length ≥ 8
    /[A-Z]/.test(password),                  // Has uppercase
    /[a-z]/.test(password),                  // Has lowercase
    /\d/.test(password),                     // Has number
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) // Has special char
  ]

  score = checks.filter(Boolean).length

  if (score <= 1) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 2) return { score, label: 'Fair', color: 'bg-orange-500' }
  if (score <= 3) return { score, label: 'Good', color: 'bg-yellow-500' }
  return { score, label: 'Strong', color: 'bg-green-500' }
})

const strengthPercentage = computed(() => (passwordStrength.value.score / 5) * 100)

const canSubmit = computed(() =>
  formState.password.length >= 8 &&
  formState.password === formState.password_confirmation &&
  passwordStrength.value.score >= 3 // Require at least "Good"
)

const submit = async () => {
  if (!canSubmit.value) {
    errorMessage.value = 'Please choose a stronger password and confirm it correctly.'
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
      message: 'Password Reset Successful!',
      description: 'You can now log in with your new password.',
      duration: 5
    })

    router.push('/login')
  } catch (err: any) {
    errorMessage.value = err.response?.data?.message || 'Failed to reset password. Link may be expired.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex justify-center items-center bg-gradient-to-r from-slate-50 to-indigo-50 p-4">
    <div class="w-full max-w-md p-8 rounded-2xl shadow-2xl bg-white border border-slate-200">
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-slate-800">Reset Your Password</h2>
        <p class="text-slate-500 mt-2">Create a strong password to secure your account</p>
      </div>

      <a-form layout="vertical">
        <!-- New Password -->
        <a-form-item label="New Password" :validate-status="errorMessage ? 'error' : ''">
          <a-input-password
            v-model:value="formState.password"
            placeholder="Enter strong password"
            size="large"
            class="rounded-lg"
          />

          <!-- Strength Indicator -->
          <div class="mt-3">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-slate-700">Password Strength</span>
              <span class="text-sm font-semibold" :class="{
                'text-red-600': passwordStrength.score <= 1,
                'text-orange-600': passwordStrength.score === 2,
                'text-yellow-600': passwordStrength.score === 3,
                'text-green-600': passwordStrength.score >= 4
              }">
                {{ passwordStrength.label || '—' }}
              </span>
            </div>

            <div class="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                class="h-full transition-all duration-300 rounded-full"
                :class="passwordStrength.color"
                :style="{ width: strengthPercentage + '%' }"
              ></div>
            </div>

            <p class="text-xs text-slate-500 mt-2">
              Use 8+ characters with uppercase, lowercase, number & symbol.
            </p>
          </div>
        </a-form-item>

        <!-- Confirm Password -->
        <a-form-item label="Confirm Password">
          <a-input-password
            v-model:value="formState.password_confirmation"
            placeholder="Confirm your password"
            size="large"
            class="rounded-lg"
          />
          <p v-if="formState.password && formState.password !== formState.password_confirmation" class="text-red-500 text-xs mt-1">
            Passwords do not match
          </p>
        </a-form-item>

        <!-- Submit Button -->
        <a-button
          type="primary"
          size="large"
          block
          :loading="loading"
          :disabled="!canSubmit"
          @click="submit"
          class="mt-6 h-12 text-lg font-semibold rounded-xl"
        >
          Reset Password
        </a-button>
      </a-form>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <p class="text-red-700 text-sm text-center">{{ errorMessage }}</p>
      </div>

      <!-- Back to Login -->
      <div class="text-center mt-6">
        <router-link to="/login" class="text-indigo-600 hover:underline font-medium">
          ← Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-primary {
  color: #4f46e5;
}
</style>