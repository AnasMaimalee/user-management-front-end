<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { notification } from 'ant-design-vue'

definePageMeta({
  layout: 'auth',
})

const loading = ref(false)
const auth = useAuthStore()

// AntDV form model
const formState = reactive({
  name: '',
  email: '',
  password: '',
  password_confirmation: '',
})

const register = async () => {
  loading.value = true
  try {
    await auth.register(formState)

    notification.success({
      message: 'Registration Successful',
      description: 'Welcome! Your account has been created.',
      placement: 'topRight',
      duration: 2,
    })

    // redirect is usually handled in store,
    // but keep here if needed
    // await navigateTo('/dashboard')

  } catch (err: any) {
    notification.error({
      message: 'Registration Failed',
      description:
        err.response?.data?.message || 'Unable to create account',
      placement: 'topRight',
      duration: 4,
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex justify-center items-center bg-gray-50">
    <div class="w-full md:w-1/3 p-6 rounded-xl bg-white shadow-lg">

      <!-- Title -->
      <div class="text-center mb-6">
        <h3 class="text-xl font-semibold text-slate-600">
          Register Your Account
        </h3>
      </div>

      <!-- Registration Form -->
      <a-form
        :model="formState"
        @finish="register"
        layout="vertical"
        class="space-y-4"
      >

        <a-form-item name="name">
          <a-input
            v-model:value="formState.name"
            placeholder="Enter your name"
          />
        </a-form-item>

        <a-form-item name="email">
          <a-input
            v-model:value="formState.email"
            type="email"
            placeholder="Enter your email"
          />
        </a-form-item>

        <a-form-item name="password">
          <a-input-password
            v-model:value="formState.password"
            placeholder="Enter your password"
          />
        </a-form-item>

        <a-form-item name="password_confirmation">
          <a-input-password
            v-model:value="formState.password_confirmation"
            placeholder="Confirm password"
          />
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
            class="w-full"
          >
            Register
          </a-button>
        </a-form-item>

      </a-form>

      <!-- Link to Login -->
      <div class="text-center mt-4">
        <p>
          Already have an account?
          <NuxtLink to="/login" class="hover:underline">
            Login here
          </NuxtLink>
        </p>
      </div>

    </div>
  </div>
</template>
