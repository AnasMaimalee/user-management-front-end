<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { notification } from 'ant-design-vue'
import api from '~/utils/api'

definePageMeta({
  middleware: 'auth'
})

const loading = ref(false)
const imagePreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null) // ← Track selected file

const form = reactive({
  current_password: '',
  password: '',
  password_confirmation: ''
})

const user = ref<any>(null)

// Base API URL for images
const API_BASE = import.meta.env.VITE_API_BASE_URL

// Avatar URL from server
const avatarUrl = computed(() => {
  return user.value?.profile_image
    ? `${API_BASE}/storage/${user.value.profile_image}`
    : null
})

// Fetch profile
const fetchProfile = async () => {
  try {
    const { data } = await api.get('/profile')
    user.value = data

    if (data.profile_image) {
      imagePreview.value = `${API_BASE}/storage/${data.profile_image}?t=${Date.now()}`
    }
  } catch (err) {
    notification.error({ message: 'Failed to load profile' })
  }
}

// Handle image selection
const onImageChange = (info: any) => {
  const file = info.file as File
  if (file) {
    selectedFile.value = file
    imagePreview.value = URL.createObjectURL(file) // Show preview immediately
  }
  return false // Prevent default upload
}

// Password Strength Logic
const strengthPercent = computed(() => {
  const pwd = form.password
  if (!pwd) return 0

  let strength = 0
  if (pwd.length >= 8) strength += 25
  if (/[a-z]/.test(pwd)) strength += 15
  if (/[A-Z]/.test(pwd)) strength += 20
  if (/[0-9]/.test(pwd)) strength += 20
  if (/[^A-Za-z0-9]/.test(pwd)) strength += 20

  return Math.min(strength, 100)
})

const strengthLabel = computed(() => {
  const percent = strengthPercent.value
  if (percent === 0) return 'Enter a password'
  if (percent < 40) return 'Weak'
  if (percent < 70) return 'Fair'
  if (percent < 90) return 'Good'
  return 'Strong'
})

const strengthColor = computed(() => {
  const percent = strengthPercent.value
  if (percent < 40) return 'bg-red-500'
  if (percent < 70) return 'bg-orange-500'
  if (percent < 90) return 'bg-yellow-500'
  return 'bg-green-500'
})

const strengthTextColor = computed(() => {
  const percent = strengthPercent.value
  if (percent < 40) return 'text-red-600'
  if (percent < 70) return 'text-orange-600'
  if (percent < 90) return 'text-yellow-600'
  return 'text-green-600'
})

// Submit form
const submit = async () => {
  loading.value = true

  try {
    const formData = new FormData()

    // Only append password fields if new password is provided
    if (form.password) {
      if (!form.current_password) {
        notification.error({ message: 'Current password is required to change password' })
        loading.value = false
        return
      }
      if (form.password !== form.password_confirmation) {
        notification.error({ message: 'New passwords do not match' })
        loading.value = false
        return
      }

      formData.append('current_password', form.current_password)
      formData.append('password', form.password)
      formData.append('password_confirmation', form.password_confirmation)
    }

    // Append image if selected
    if (selectedFile.value) {
      formData.append('profile_image', selectedFile.value)
    }

    const { data } = await api.post('/profile', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })

    // Update user data
    user.value = data.user || data

    // Update image preview from server response
    if (user.value.profile_image) {
      imagePreview.value = `${API_BASE}/storage/${user.value.profile_image}?t=${Date.now()}`
    }

    // Reset file input
    selectedFile.value = null

    notification.success({
      message: 'Profile updated successfully!'
    })
  } catch (err: any) {
    notification.error({
      message: err.response?.data?.message || 'Failed to update profile'
    })
  } finally {
    loading.value = false
  }
}

onMounted(fetchProfile)
</script>
<template><div class="max-w-4xl mx-auto p-6">
  <h2 class="text-2xl font-semibold mb-6">Profile Settings</h2>

  <div class="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
    
    <!-- LEFT -->
    <div class="flex flex-col items-center">
      <img
        v-if="imagePreview || avatarUrl"
        :src="imagePreview || avatarUrl"
        class="w-32 h-32 rounded-full object-cover border"
      />

      <div
        v-else
        class="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center"
      >
        <span class="text-gray-500">Avatar</span>
      </div>

     <a-upload
  :before-upload="onImageChange"
  :show-upload-list="false"
  accept="image/*"
  class="mt-4"
>
  <a-button type="default">
    Change Photo
  </a-button>
</a-upload>
    </div>

    <!-- RIGHT -->
    <div class="md:col-span-2 space-y-4">
      <a-input-password
        v-model:value="form.current_password"
        placeholder="Current password"
      />

      <a-input-password
        v-model:value="form.password"
        placeholder="New password"
      />

      <!-- PASSWORD STRENGTH -->
      <div class="h-2 rounded bg-gray-200 overflow-hidden">
        <div
          class="h-full transition-all"
          :class="strengthColor"
          :style="{ width: strengthPercent + '%' }"
        ></div>
      </div>
      <p class="text-sm" :class="strengthTextColor">
        {{ strengthLabel }}
      </p>

      <a-input-password
        v-model:value="form.password_confirmation"
        placeholder="Confirm password"
      />

      <a-button
        type="primary"
        :loading="loading"
        @click="submit"
      >
        Save Changes
      </a-button>
    </div>
  </div>
</div>

</template>
