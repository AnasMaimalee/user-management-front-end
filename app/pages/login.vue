<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { notification } from 'ant-design-vue'

definePageMeta({
  layout: 'auth',
  ssr: false,
})

const loading = ref(false)
const auth = useAuthStore()

const formState = reactive({
  email: '',
  password: '',
})

const login = async () => {
  loading.value = true
  try {
    await auth.login({
      email: formState.email,
      password: formState.password,
    })

    notification.success({
      message: 'Login Successful',
      description: 'Welcome back!',
      placement: 'topRight',
      duration: 2,
    })
  } catch (err: any) {
    notification.error({
      message: 'Login Failed',
      description:
        err.response?.data?.message || 'Invalid email or password',
      placement: 'topRight',
      duration: 4,
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <!-- Loader Overlay -->
  <div
    v-if="loading"
    class="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm"
  >
    <a-spin size="large" tip="Signing you in..." />
  </div>

  <!-- Page -->
  <div
    class="min-h-screen flex justify-center items-center
           bg-gradient-to-r from-slate-50 to-indigo-50"
  >
    <div
      class="w-full md:w-1/3 p-6 rounded-xl shadow-xl
             bg-white border border-slate-200"
    >
      <!-- Title -->
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-primary">
          Login to Your Account
        </h2>
        <p class="text-gray-500 mt-1">
          Enter your credentials to access your dashboard
        </p>
      </div>

      <!-- Form -->
      <a-form
        :model="formState"
        @finish="login"
        layout="vertical"
      >
        <a-form-item name="email">
          <a-input
            v-model:value="formState.email"
            type="email"
            placeholder="Enter your email"
            size="large"
          />
        </a-form-item>

        <a-form-item name="password">
          <a-input-password
            v-model:value="formState.password"
            placeholder="Enter your password"
            size="large"
          />
        </a-form-item>

        <!-- Forgot password -->
        <div class="text-right mb-4">
          <NuxtLink
            to="/forgot-password"
            class="text-sm text-primary hover:underline"
          >
            Forgot password?
          </NuxtLink>
        </div>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
            class="w-full"
            size="large"
          >
            Login
          </a-button>
        </a-form-item>
      </a-form>

      <!-- Divider -->
      <div class="flex items-center my-4">
        <hr class="flex-1 border-gray-300" />
        <span class="px-2 text-gray-400">or</span>
        <hr class="flex-1 border-gray-300" />
      </div>

      <!-- Register -->
      <div class="text-center mt-2">
        <p class="text-gray-600">
          Don't have an account?
          <NuxtLink
            to="/"
            class="text-primary font-medium hover:underline"
          >
            Register here
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
