<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { notification } from 'ant-design-vue'
import api from '~/utils/api'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: 'auth' })

const auth = useAuthStore()
const loading = ref(false)

const imagePreview = ref<string | null>(null)
const selectedFile = ref<File | null>(null)

const form = reactive({
  current_password: '',
  password: '',
  password_confirmation: ''
})


/* -----------------------------
   USER DATA
--------------------------------*/
const user = computed(() => auth.user)

/* -----------------------------
   IMAGE PREVIEW (INSTANT)
--------------------------------*/

const avatarSrc = computed(() => {
  return (
    imagePreview.value ||
    auth.profile_image_url ||
    '/avatar.png'
  )
})

const onImageChange = (file: File) => {
  imagePreview.value = URL.createObjectURL(file)
  selectedFile.value = file
  return false
}

/* -----------------------------
   PASSWORD STRENGTH
--------------------------------*/
const strengthPercent = computed(() => {
  const p = form.password
  let s = 0
  if (p.length >= 8) s += 25
  if (/[A-Z]/.test(p)) s += 20
  if (/[a-z]/.test(p)) s += 15
  if (/\d/.test(p)) s += 20
  if (/[^A-Za-z0-9]/.test(p)) s += 20
  return Math.min(s, 100)
})

const strengthLabel = computed(() => {
  const s = strengthPercent.value
  if (!form.password) return ''
  if (s < 40) return 'Weak'
  if (s < 70) return 'Fair'
  if (s < 90) return 'Good'
  return 'Strong'
})

const strengthColor = computed(() => {
  const s = strengthPercent.value
  if (s < 40) return 'bg-red-500'
  if (s < 70) return 'bg-orange-500'
  if (s < 90) return 'bg-yellow-500'
  return 'bg-green-500'
})

/* -----------------------------
   SUBMIT
--------------------------------*/
const submit = async () => {
  loading.value = true

  try {
    const formData = new FormData()

    if (selectedFile.value) {
      formData.append('profile_image', selectedFile.value)
    }

    if (form.password) {
      if (!form.current_password) {
        notification.error({ message: 'Current password required' })
        loading.value = false
        return
      }

      formData.append('current_password', form.current_password)
      formData.append('password', form.password)
      formData.append('password_confirmation', form.password_confirmation)
    }

    await api.post('/profile', formData)

    // REFRESH USER DATA
    await auth.fetchMe()

    imagePreview.value = null
    selectedFile.value = null

    notification.success({
      message: 'Profile updated successfully'
    })
  } catch (err: any) {
    notification.error({
      message: err.response?.data?.message || 'Update failed'
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!auth.user) auth.fetchMe()
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-6">
    <h2 class="text-2xl font-semibold mb-6">Profile Settings</h2>

    <div class="bg-white rounded-xl shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

      <!-- AVATAR -->
      <div class="flex flex-col items-center">
        <img
          :src="avatarSrc"
          class="w-32 h-32 rounded-full object-cover border"
        />

        <a-upload
          :before-upload="onImageChange"
          :show-upload-list="false"
          accept="image/*"
          class="mt-4"
        >
          <a-button>Change Photo</a-button>
        </a-upload>
      </div>

      <!-- PASSWORD -->
      <div class="md:col-span-2 space-y-4">
        <a-input-password
          v-model:value="form.current_password"
          placeholder="Current password"
        />

        <a-input-password
          v-model:value="form.password"
          placeholder="New password"
        />

        <div v-if="form.password" class="space-y-1">
          <div class="h-2 bg-gray-200 rounded overflow-hidden">
            <div
              class="h-full transition-all"
              :class="strengthColor"
              :style="{ width: strengthPercent + '%' }"
            />
          </div>
          <p class="text-sm">{{ strengthLabel }}</p>
        </div>

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
