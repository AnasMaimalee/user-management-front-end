<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-12 px-8 shadow-lg">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl font-bold mb-2">Welcome back, {{ auth.user?.name || 'Admin' }} 👋</h1>
        <p class="text-xl opacity-90">Here's what's happening in your system today – {{ currentDate }}</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto p-6 -mt-8">
      <!-- Stats Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Total Employees -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-1">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 dark:text-slate-400">Total Employees</p>
              <p class="text-3xl font-bold text-slate-800 dark:text-white mt-2">{{ stats.employees }}</p>
              <p class="text-xs text-green-600 mt-2">+12% from last month</p>
            </div>
            <div class="bg-blue-100 dark:bg-blue-900 p-4 rounded-full">
              <icon name="heroicons:user-group-20-solid" class="w-8 h-8 text-blue-600 dark:text-blue-300" />
            </div>
          </div>
        </div>

        <!-- Active Branches -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-1">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 dark:text-slate-400">Active Branches</p>
              <p class="text-3xl font-bold text-slate-800 dark:text-white mt-2">{{ stats.branches }}</p>
              <p class="text-xs text-green-600 mt-2">All operational</p>
            </div>
            <div class="bg-green-100 dark:bg-green-900 p-4 rounded-full">
              <icon name="heroicons:building-office-20-solid" class="w-8 h-8 text-green-600 dark:text-green-300" />
            </div>
          </div>
        </div>

        <!-- Departments -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-1">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 dark:text-slate-400">Departments</p>
              <p class="text-3xl font-bold text-slate-800 dark:text-white mt-2">{{ stats.departments }}</p>
              <p class="text-xs text-blue-600 mt-2">Well structured</p>
            </div>
            <div class="bg-purple-100 dark:bg-purple-900 p-4 rounded-full">
              <icon name="heroicons:briefcase-20-solid" class="w-8 h-8 text-purple-600 dark:text-purple-300" />
            </div>
          </div>
        </div>

        <!-- Job Ranks -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition transform hover:-translate-y-1">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-slate-500 dark:text-slate-400">Job Ranks</p>
              <p class="text-3xl font-bold text-slate-800 dark:text-white mt-2">{{ stats.ranks }}</p>
              <p class="text-xs text-orange-600 mt-2">Hierarchy defined</p>
            </div>
            <div class="bg-orange-100 dark:bg-orange-900 p-4 rounded-full">
              <icon name="heroicons:chart-bar-20-solid" class="w-8 h-8 text-orange-600 dark:text-orange-300" />
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions & System Overview -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Quick Actions -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold mb-4 text-slate-800 dark:text-white">Quick Actions</h2>
          <div class="grid grid-cols-2 gap-4">
            <router-link to="/employees" class="bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 p-4 rounded-lg text-center transition">
              <icon name="heroicons:user-plus-20-solid" class="text-3xl text-blue-600 mb-2" />
              <p class="font-medium text-slate-700 dark:text-slate-200">Add Employee</p>
            </router-link>

            <router-link to="/branches" class="bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-800/50 p-4 rounded-lg text-center transition">
              <icon name="heroicons:map-pin-20-solid" class="text-3xl text-green-600 mb-2" />
              <p class="font-medium text-slate-700 dark:text-slate-200">Manage Branches</p>
            </router-link>

            <router-link to="/departments" class="bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-800/50 p-4 rounded-lg text-center transition">
              <icon name="heroicons:building-office-2-20-solid" class="text-3xl text-purple-600 mb-2" />
              <p class="font-medium text-slate-700 dark:text-slate-200">Departments</p>
            </router-link>

            <router-link to="/ranks" class="bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-800/50 p-4 rounded-lg text-center transition">
              <icon name="heroicons:academic-cap-20-solid" class="text-3xl text-orange-600 mb-2" />
              <p class="font-medium text-slate-700 dark:text-slate-200">Job Ranks</p>
            </router-link>
          </div>
        </div>

        <!-- System Overview -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-semibold mb-4 text-slate-800 dark:text-white">System Overview</h2>
          <div class="space-y-4">
            <div class="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
              <span class="text-slate-600 dark:text-slate-300">System Status</span>
              <a-tag color="green">Operational</a-tag>
            </div>
            <div class="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
              <span class="text-slate-600 dark:text-slate-300">Last Backup</span>
              <span class="text-sm text-slate-500">Today at 02:00 AM</span>
            </div>
            <div class="flex items-center justify-between py-3 border-b border-slate-200 dark:border-slate-700">
              <span class="text-slate-600 dark:text-slate-300">Active Users</span>
              <span class="font-medium">12 online now</span>
            </div>
            <div class="flex items-center justify-between py-3">
              <span class="text-slate-600 dark:text-slate-300">App Version</span>
              <span class="text-sm">v2.1.0</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-12 text-center text-slate-500 dark:text-slate-400">
        <p>© 2025 HR Management System • Maimalee 🚀</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()

// Mock stats - replace with real API later
const stats = ref({
  employees: 248,
  branches: 12,
  departments: 18,
  ranks: 15,
})

const currentDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

onMounted(() => {
  // Fetch real stats here later
})
</script>

<style scoped>
.card-hover:hover {
  transform: translateY(-4px);
}
</style>