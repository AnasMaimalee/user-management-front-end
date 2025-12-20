<template>
  <div class="p-6 bg-slate-100 dark:bg-slate-900 min-h-screen">
    <h1 class="text-2xl font-bold mb-4 text-slate-800 dark:text-slate-100">
      Departments
    </h1>

    <!-- Create Department Form -->
    <form @submit.prevent="createDepartment" class="mb-6 flex gap-2">
      <input
        v-model="departmentName"
        type="text"
        placeholder="Enter department name"
        class="flex-1 p-2 rounded border border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        :disabled="loading"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? 'Creating...' : 'Create' }}
      </button>
    </form>

    <!-- Error Message -->
    <p v-if="error" class="text-red-500 mb-4">{{ error }}</p>

    <!-- Departments List -->
    <div class="bg-white dark:bg-slate-800 p-4 rounded shadow">
      <h2 class="font-semibold mb-2 text-slate-700 dark:text-slate-100">Existing Departments</h2>
      <ul>
        <li
          v-for="dept in departments"
          :key="dept.id"
          class="py-1 border-b border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
        >
          {{ dept.name }}
        </li>
      </ul>
      <p v-if="departments.length === 0" class="text-gray-500">No departments yet.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const departmentName = ref('')
const departments = ref<any[]>([])
const error = ref('')
const loading = ref(false)

// Load existing departments
const fetchDepartments = async () => {
  try {
    const res = await axios.get('http://127.0.0.1:8000/api/departments', {
      headers: {
        Authorization: `Bearer ${auth.token}`
      }
    })
    departments.value = res.data
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to fetch departments'
  }
}

// Create a new department
const createDepartment = async () => {
  if (!departmentName.value.trim()) return
  error.value = ''
  loading.value = true
  try {
    const res = await axios.post(
      'http://127.0.0.1:8000/api/departments',
      { name: departmentName.value },
      {
        headers: {
          Authorization: `Bearer ${auth.token}`
        }
      }
    )
    departments.value.push(res.data)
    departmentName.value = ''
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to create department'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDepartments()
})
</script>
