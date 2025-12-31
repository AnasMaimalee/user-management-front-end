<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
    <!-- Header Banner -->
    <div class="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-16 px-8 shadow-2xl">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div>
          <h1 class="text-5xl font-bold mb-3">Welcome back, {{ auth.user?.name || 'User' }} 👋</h1>
          <p class="text-xl opacity-90">{{ currentDate }}</p>
        </div>
        <a-avatar :size="80" class="bg-white/20 shadow-lg">
          {{ auth.user?.name?.charAt(0).toUpperCase() || 'U' }}
        </a-avatar>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto p-6 -mt-12">
      <!-- Employee Dashboard -->
      <div v-if="isEmployee" class="space-y-8">
        <!-- Key Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <a-card class="shadow-lg hover:shadow-xl transition">
            <template #title>
              <div class="flex items-center gap-3">
                <icon name="heroicons:calendar-days-20-solid" class="w-6 h-6 text-indigo-600" />
                <span>Attendance Rate</span>
              </div>
            </template>
            <p class="text-4xl font-bold text-indigo-600">{{ employeeStats.attendanceRate }}%</p>
            <a-progress :percent="employeeStats.attendanceRate" :show-info="false" class="mt-4" />
            <p class="text-sm text-green-600 mt-2">↑ 5% improvement this month</p>
          </a-card>

          <a-card class="shadow-lg hover:shadow-xl transition">
            <template #title>
              <div class="flex items-center gap-3">
                <icon name="heroicons:clock-20-solid" class="w-6 h-6 text-purple-600" />
                <span>Leave Balance</span>
              </div>
            </template>
            <p class="text-4xl font-bold text-purple-600">{{ employeeStats.leaveBalance }} days</p>
            <a-progress :percent="(employeeStats.leaveBalance / 20) * 100" status="active" class="mt-4" />
            <p class="text-sm text-gray-600 mt-2">Annual leave remaining</p>
          </a-card>

          <a-card class="shadow-lg hover:shadow-xl transition">
            <template #title>
              <div class="flex items-center gap-3">
                <icon name="heroicons:star-20-solid" class="w-6 h-6 text-yellow-600" />
                <span>Performance Score</span>
              </div>
            </template>
            <p class="text-4xl font-bold text-yellow-600">{{ employeeStats.performanceScore }}/10</p>
            <a-rate :value="employeeStats.performanceScore / 2" allow-half disabled class="mt-4" />
            <p class="text-sm text-green-600 mt-2">Excellent!</p>
          </a-card>
        </div>

        <!-- Wallet & Transactions -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <a-card class="shadow-lg">
            <template #title>My Wallet</template>
            <div class="text-center py-8">
              <p class="text-5xl font-bold text-green-600">{{ formatCurrency(employeeStats.wallet.balance) }}</p>
              <p class="text-gray-500 mt-2">Current Balance</p>
              <a-button type="primary" size="large" class="mt-6">Request Withdrawal</a-button>
            </div>
          </a-card>

          <a-card class="shadow-lg">
            <template #title>Recent Transactions</template>
            <a-list item-layout="horizontal" :data-source="employeeStats.wallet.transactions">
              <template #renderItem="{ item }">
                <a-list-item>
                  <a-list-item-meta :description="item.date">
                    <template #title>
                      <span :class="item.type === 'credit' ? 'text-green-600' : 'text-red-600'">{{ item.description }}</span>
                    </template>
                  </a-list-item-meta>
                  <div class="font-semibold" :class="item.type === 'credit' ? 'text-green-600' : 'text-red-600'">
                    {{ item.type === 'credit' ? '+' : '-' }}{{ formatCurrency(item.amount) }}
                  </div>
                </a-list-item>
              </template>
            </a-list>
          </a-card>
        </div>

        <!-- Quick Actions -->
        <a-card class="shadow-lg">
          <template #title>Quick Actions</template>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <router-link to="/leave-request" class="text-center p-6 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition">
              <icon name="heroicons:paper-airplane-20-solid" class="w-10 h-10 text-indigo-600 mb-2" />
              <p class="font-medium">Request Leave</p>
            </router-link>
            <router-link to="/payslip" class="text-center p-6 bg-green-50 hover:bg-green-100 rounded-xl transition">
              <icon name="heroicons:document-text-20-solid" class="w-10 h-10 text-green-600 mb-2" />
              <p class="font-medium">View Payslip</p>
            </router-link>
            <router-link to="/profile" class="text-center p-6 bg-purple-50 hover:bg-purple-100 rounded-xl transition">
              <icon name="heroicons:user-circle-20-solid" class="w-10 h-10 text-purple-600 mb-2" />
              <p class="font-medium">My Profile</p>
            </router-link>
            <router-link to="/support" class="text-center p-6 bg-orange-50 hover:bg-orange-100 rounded-xl transition">
              <icon name="heroicons:chat-bubble-left-right-20-solid" class="w-10 h-10 text-orange-600 mb-2" />
              <p class="font-medium">Support</p>
            </router-link>
          </div>
        </a-card>
      </div>

      <!-- Super Admin Dashboard -->
      <div v-else-if="isSuperAdmin" class="space-y-8">
        <!-- Admin Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <a-card class="shadow-lg hover:shadow-xl transition">
            <a-statistic title="Total Employees" :value="stats.employees" />
            <template #footer>+15% from last year</template>
          </a-card>
          <a-card class="shadow-lg hover:shadow-xl transition">
            <a-statistic title="Active Branches" :value="stats.branches" />
          </a-card>
          <a-card class="shadow-lg hover:shadow-xl transition">
            <a-statistic title="Departments" :value="stats.departments" />
          </a-card>
          <a-card class="shadow-lg hover:shadow-xl transition">
            <a-statistic title="Job Ranks" :value="stats.ranks" />
          </a-card>
        </div>

        <!-- Employee Growth Chart -->
        <a-card class="shadow-lg">
          <template #title>Employee Growth Over Time</template>
          <Line :data="chartData" :config="lineConfig" class="h-96" />
        </a-card>

        <!-- More admin sections here (system logs, user activity, etc.) -->
      </div>

      <!-- Footer -->
      <div class="mt-16 text-center text-gray-500 text-sm">
        <p>© 2025 Maimalee HR System • Built with care 🚀</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { Line } from '@ant-design/charts' // ← This works now!

const auth = useAuthStore()

const role = computed(() => auth.user?.role || 'employee')
const isEmployee = computed(() => role.value === 'employee')
const isSuperAdmin = computed(() => role.value === 'super_admin')

const currentDate = computed(() => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))

// Mock data (replace with API calls later)
const stats = ref({ employees: 350, branches: 15, departments: 20, ranks: 18 })

const employeeStats = ref({
  attendanceRate: 98,
  leaveBalance: 12,
  performanceScore: 8.7,
  wallet: {
    balance: 2850,
    transactions: [
      { description: 'Monthly Salary', amount: 2500, type: 'credit', date: 'Dec 28, 2025' },
      { description: 'Performance Bonus', amount: 500, type: 'credit', date: 'Dec 15, 2025' },
      { description: 'Tax Deduction', amount: 150, type: 'debit', date: 'Dec 28, 2025' },
    ]
  }
})

const formatCurrency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

// Chart data for admin
const chartData = [
  { month: 'Jan', employees: 280 },
  { month: 'Feb', employees: 290 },
  { month: 'Mar', employees: 300 },
  { month: 'Apr', employees: 310 },
  { month: 'May', employees: 325 },
  { month: 'Jun', employees: 340 },
  { month: 'Jul', employees: 350 },
]

const lineConfig = {
  xField: 'month',
  yField: 'employees',
  smooth: true,
  animation: true,
  point: { size: 5, shape: 'diamond' },
}
</script>