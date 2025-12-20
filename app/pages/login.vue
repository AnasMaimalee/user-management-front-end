<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'  // <-- Import your store

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
definePageMeta({
  layout: 'auth',
})
const auth = useAuthStore()  // <-- Initialize the store

const login = async () => {
  error.value = ''
  loading.value = true
  try {
    // Use the store action for login
    await auth.login({ email: email.value, password: password.value })
    // Redirect is handled inside the store
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>


<template>
  <div class="min-h-screen flex justify-center items-center bg-gradient-to-r from-slate-50 to-indigo-50">
    <div class="w-full md:w-1/3 p-6 rounded-xl shadow-xl bg-white border border-slate-200">
      
      <!-- Title -->
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-slate-600">Login to Your Account</h2>
        <p class="text-gray-500 mt-1">Enter your credentials to access your dashboard</p>
      </div>

      <!-- Error Message -->
      <p v-if="error" class="text-red-500 mb-4 text-center font-medium">{{ error }}</p>

      <!-- Login Form -->
      <form @submit.prevent="login" class="space-y-4">
        <input
          v-model="email"
          type="email"
          placeholder="Enter your email"
          class="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
        />

        <input
          v-model="password"
          type="password"
          placeholder="Enter your password"
          class="w-full border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent transition"
        />

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-slate-600 text-white py-3 rounded-lg font-semibold hover:bg-slate-700 hover:shadow-lg transition disabled:opacity-50"
        >
          <span v-if="!loading">Login</span>
          <span v-else>Logging in...</span>
        </button>
      </form>

      <!-- Divider -->
      <div class="flex items-center my-4">
        <hr class="flex-1 border-gray-300" />
        <span class="px-2 text-gray-400">or</span>
        <hr class="flex-1 border-gray-300" />
      </div>

      <!-- Register Link -->
      <div class="text-center mt-2">
        <p class="text-gray-600">
          Don't have an account?
          <router-link to="/" class="text-slate-600 font-medium hover:underline">Register here</router-link>
        </p>
      </div>

    </div>
  </div>
</template>
