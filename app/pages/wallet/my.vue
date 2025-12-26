<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Compact Header -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-10 px-6 shadow-md">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-3xl md:text-4xl font-bold mb-2">My Savings Wallet</h1>
        <p class="text-base opacity-90">Grow your savings effortlessly with every paycheck</p>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-6 -mt-6">
      <!-- Balance Card (Smaller & Cleaner) -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8 hover:shadow-xl transition">
        <p class="text-slate-500 text-sm mb-2">Current Balance</p>
        <p class="text-5xl font-bold text-primary mb-6">
          ₦{{ Number(wallet.balance).toLocaleString('en-NG') }}
        </p>

        <div class="grid grid-cols-2 gap-8">
          <div>
            <p class="text-slate-500 text-sm">Monthly Savings</p>
            <p class="text-2xl font-semibold text-success">
              ₦{{ Number(wallet.monthly_savings).toLocaleString() }}
            </p>
          </div>
          <div>
            <p class="text-slate-500 text-sm">Next Deposit</p>
            <p class="text-2xl font-semibold text-primary">
              {{ nextDepositDate }}
            </p>
          </div>
        </div>
      </div>

      <!-- Quick Actions (Small & Neat) -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
        <button
          @click="showWithdrawModal = true"
          class="bg-white rounded-lg shadow p-5 text-center hover:shadow-md transition border border-slate-200"
        >
          <div class="w-12 h-12 bg-error/10 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl text-error">🏧</span>
          </div>
          <p class="text-sm font-medium text-slate-800">Withdraw</p>
        </button>

        <button
          @click="showDepositModal = true"
          class="bg-white rounded-lg shadow p-5 text-center hover:shadow-md transition border border-slate-200"
        >
          <div class="w-12 h-12 bg-success/10 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl text-success">💰</span>
          </div>
          <p class="text-sm font-medium text-slate-800">Add Money</p>
        </button>

        <button
          @click="showGoalModal = true"
          class="bg-white rounded-lg shadow p-5 text-center hover:shadow-md transition border border-slate-200"
        >
          <div class="w-12 h-12 bg-warning/10 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl text-warning">🎯</span>
          </div>
          <p class="text-sm font-medium text-slate-800">Set Goal</p>
        </button>

        <div class="bg-white rounded-lg shadow p-5 text-center border border-slate-200">
          <div class="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span class="text-2xl text-primary">📊</span>
          </div>
          <p class="text-sm font-medium text-slate-800">History</p>
        </div>
      </div>

      <!-- Recent Transactions (Compact) -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-5">
          <h2 class="text-xl font-semibold text-slate-800">Recent Transactions</h2>
          <a-button type="link" class="text-primary text-sm">View All →</a-button>
        </div>

        <div v-if="transactions.length === 0" class="text-center py-12">
          <span class="text-6xl opacity-20">🌱</span>
          <p class="text-slate-600 mt-4">No transactions yet</p>
          <p class="text-sm text-slate-500">Your savings will appear after payroll</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="tx in transactions.slice(0, 6)"
            :key="tx.id"
            class="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                :class="tx.type === 'deposit' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'"
              >
                {{ tx.type === 'deposit' ? '↑' : '↓' }}
              </div>
              <div>
                <p class="text-sm font-medium text-slate-800">{{ tx.description || tx.type.toUpperCase() }}</p>
                <p class="text-xs text-slate-500">{{ formatDate(tx.created_at) }}</p>
              </div>
            </div>

            <p class="text-lg font-bold" :class="tx.type === 'deposit' ? 'text-success' : 'text-error'">
              {{ tx.type === 'deposit' ? '+' : '-' }}₦{{ Number(tx.amount).toLocaleString() }}
            </p>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-10 text-center text-slate-500 text-sm">
        <p>© 2025 Maimalee HR • Your financial wellness partner</p>
      </div>
    </div>

    <!-- Modals -->
    <a-modal v-model:open="showWithdrawModal" title="Request Withdrawal" width="500px">
      <p class="text-center text-slate-600 py-6">Feature coming soon!</p>
    </a-modal>

    <a-modal v-model:open="showDepositModal" title="Add Money" width="500px">
      <p class="text-center text-slate-600 py-6">Manual deposit coming soon!</p>
    </a-modal>

    <a-modal v-model:open="showGoalModal" title="Set Savings Goal" width="500px">
      <p class="text-center text-slate-600 py-6">Goal tracking coming soon!</p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '~/utils/api'

const wallet = ref({ balance: 0, monthly_savings: 0 })
const transactions = ref<any[]>([])

const showWithdrawModal = ref(false)
const showDepositModal = ref(false)
const showGoalModal = ref(false)

const nextDepositDate = computed(() => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  date.setDate(1)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
})

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const fetchWallet = async () => {
  try {
    const res = await api.get('/wallet/my')
    wallet.value = res.data
    transactions.value = (res.data.transactions || [])
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  } catch (err) {
    console.error('Failed to load wallet')
  }
}

onMounted(fetchWallet)
</script>

<style scoped>
.max-w-6xl {
  max-width: 1150px;
}
</style>