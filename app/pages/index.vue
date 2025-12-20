<template>
  
    <div class="min-h-screen flex justify-center items-center bg-gray-50">
      <div class="w-full md:w-1/3 p-6 rounded-xl bg-white shadow-lg">
        
        <!-- Title -->
        <div class="text-center mb-6">
          <h3 class="text-xl font-semibold text-blue-600">Register Your Account</h3>
        </div>

        <!-- Registration Form -->
        <form @submit.prevent="register" class="space-y-4">
          <input
            v-model="form.name"
            type="text"
            placeholder="Enter your name"
            class="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            v-model="form.email"
            type="email"
            placeholder="Enter your email"
            class="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            v-model="form.password"
            type="password"
            placeholder="Enter your password"
            class="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            v-model="form.password_confirmation"
            type="password"
            placeholder="Confirm password"
            class="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <!-- Register Button -->
          <div class="flex mt-4">
            <button
              type="submit"
              class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 hover:shadow-lg transition"
            >
              Register
            </button>
          </div>
        </form>

        <!-- Link to Login -->
        <div class="text-center mt-4">
          <p class="text-gray-600">
            Already have an account?
            <NuxtLink to="/login" class="text-blue-600 hover:underline">Login here</NuxtLink>
          </p>
        </div>

      </div>
    </div>
  
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
definePageMeta({
  layout: 'auth',
})
const router = useRouter()

const form = ref({
  name: '',
  email: '',
  password: '',
  password_confirmation: ''
})

const register = async () => {
  try {
    const response = await axios.post('http://127.0.0.1:8000/api/register', form.value)
    console.log('Registration successful:', response.data)

    // Save token to localStorage
    localStorage.setItem('token', response.data.access_token)

    // Redirect to dashboard
    router.push('/dashboard')
  } catch (error) {
    console.error('Registration error:', error.response?.data || error)
    alert(error.response?.data?.message || 'Registration failed')
  }
}
</script>
