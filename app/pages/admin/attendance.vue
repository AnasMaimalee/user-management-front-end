<!-- pages/admin/attendance/index.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
    <div class="max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
      <!-- Header -->
      <div class="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-3xl font-bold text-slate-800 mb-2">Attendance Management</h1>
          <p class="text-slate-600">Realtime biometric attendance • {{ currentDate }}</p>
        </div>

        <div class="flex items-center gap-4 mt-4 md:mt-0">
          <div class="flex items-center gap-2">
            <div class="w-3 h-3 rounded-full" :class="scannerActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'"></div>
            <span class="text-sm font-medium text-slate-700">
              {{ scannerActive ? 'Scanner Active' : 'Scanner Ready' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Sidebar -->
        <div class="lg:col-span-3 space-y-6">
          <!-- Scanner Card -->
          <div class="bg-white rounded-2xl shadow-lg p-6">
            <h2 class="text-xl font-semibold text-slate-800 mb-6 flex items-center gap-2">
              <icon name="heroicons:finger-print-20-solid" class="w-7 h-7 text-indigo-600" />
              Biometric Scanner
            </h2>

            <div class="text-center py-10">
              <div class="text-9xl text-indigo-100 mb-8">🖐️</div>
              <p class="text-slate-600 text-lg mb-8">
                {{ scannerActive ? 'Place finger on scanner' : 'Click below to activate scanner' }}
              </p>

              <a-button
                type="primary"
                size="large"
                class="w-full h-16 text-xl font-semibold"
                :loading="scannerLoading"
                @click="toggleScanner"
              >
                {{ scannerActive ? 'Stop Scanner' : 'Start Scanner' }}
              </a-button>

              <div v-if="lastScan" class="mt-8 p-4 bg-green-50 rounded-xl border border-green-200">
                <p class="text-green-800 font-medium">Last Scan</p>
                <p class="text-green-700 font-semibold">{{ lastScan.name }}</p>
                <p class="text-sm text-green-600">{{ lastScan.time }} • {{ lastScan.action }}</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="bg-white rounded-2xl shadow-lg p-6 space-y-4">
            <h3 class="text-lg font-semibold text-slate-800 mb-4">Actions</h3>
            <BiometricResetButton class="w-full" />
            <div class="mt-2"></div>
            <AttendanceExport class="w-full" />
          </div>

          <!-- Stats -->
          <AttendanceStats />
        </div>

        <!-- Main Table -->
        <div class="lg:col-span-9">
          <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div class="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 class="text-xl font-semibold text-slate-800">
                {{ filterActive ? 'Filtered Attendance' : "Today's Attendance" }}
              </h2>

              <AttendanceFilters @filter-change="handleFilterChange" />
            </div>

            <!-- Table with NO HORIZONTAL SCROLL -->
            <TodayAttendanceTable 
              :filter="activeFilter"
              @open-employee="openEmployeeDrawer"
            />

            <div class="p-4 bg-indigo-50 border-t border-indigo-200 flex items-center gap-3">
              <div class="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
              <p class="text-sm text-indigo-800 font-medium">Realtime biometric updates active</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Employee Drawer -->
      <EmployeeAttendanceDrawer
        :employee="selectedEmployee"
        :open="drawerVisible"
        @close="closeDrawer"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useNuxtApp } from '#app'
import api from '~/utils/api'
import { message } from 'ant-design-vue'

import TodayAttendanceTable from '~/components/attendance/TodayAttendanceTable.vue'
import AttendanceStats from '~/components/attendance/AttendanceStats.vue'
import AttendanceFilters from '~/components/attendance/AttendanceFilters.vue'
import BiometricResetButton from '~/components/biometric/BiometricResetButton.vue'
import AttendanceExport from '~/components/attendance/AttendanceExport.vue'
import EmployeeAttendanceDrawer from '~/components/attendance/EmployeeAttendanceDrawer.vue'

const { $echo } = useNuxtApp()

const selectedEmployee = ref<any | null>(null)
const drawerVisible = ref(false)
const scannerActive = ref(false)
const scannerLoading = ref(false)
const lastScan = ref<{ name: string; time: string; action: string } | null>(null)
const activeFilter = ref<{ from: string; to: string } | null>(null)
const filterActive = ref(false)

const currentDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
})

const openEmployeeDrawer = (employee: any) => {
  selectedEmployee.value = employee
  drawerVisible.value = true
}

const closeDrawer = () => {
  drawerVisible.value = false
  selectedEmployee.value = null
}

const toggleScanner = () => {
  scannerLoading.value = true
  setTimeout(() => {
    scannerActive.value = !scannerActive.value
    scannerLoading.value = false
    if (scannerActive.value) {
      message.success('Biometric scanner activated — ready for thumb scans')
    } else {
      message.info('Biometric scanner stopped')
    }
  }, 1000)
}

const handleFilterChange = (filter: { from: string; to: string } | null) => {
  activeFilter.value = filter
  filterActive.value = !!filter
}

onMounted(() => {
  $echo.private('biometric.punch')
    .listen('.fingerprint.scanned', async (e: any) => {
      if (!scannerActive.value) return

      try {
        const res = await api.post('/attendance/punch', {
          device_user_id: e.uid
        })

        const name = `${res.data.employee.first_name} ${res.data.employee.last_name}`
        const action = res.data.action === 'Clock Out' ? 'clocked out' : 'clocked in'

        lastScan.value = {
          name,
          time: new Date().toLocaleTimeString(),
          action
        }

        message.success(`${name} ${action}!`)

        const audio = new Audio('/beep.mp3')
        audio.play().catch(() => {
          console.log('Beep sound blocked (user needs to interact first)')
        })
      } catch (err: any) {
        message.error(err.response?.data?.message || 'Scan failed')
      }
    })
})

onUnmounted(() => {
  $echo.leave('biometric.punch')
})
</script>

<style scoped>
.transition-shadow {
  transition: box-shadow 0.3s ease;
}
</style>