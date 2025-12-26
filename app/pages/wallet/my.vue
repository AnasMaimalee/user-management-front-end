<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Compact Header -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-10 px-6">
      <div class="max-w-6xl mx-auto text-center">
        <h1 class="text-3xl font-bold mb-2">My Savings Wallet</h1>
        <p class="text-base opacity-90">Build your future, one deduction at a time</p>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-6 -mt-6">
      <!-- Balance & Goal Card -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Balance -->
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
          <p class="text-slate-500 text-sm mb-2">Current Balance</p>
          <p class="text-4xl font-bold text-primary">
            ₦{{ Number(wallet.balance).toLocaleString('en-NG') }}
          </p>
          <div class="mt-4 flex items-center justify-between">
            <div>
              <p class="text-xs text-slate-500">Monthly Savings</p>
              <p class="text-xl font-semibold text-success">
                ₦{{ Number(wallet.monthly_savings).toLocaleString() }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-xs text-slate-500">Next Deposit</p>
              <p class="text-lg font-medium text-primary">{{ nextDepositDate }}</p>
            </div>
          </div>
        </div>

        <!-- Goal Progress -->
        <div v-if="wallet.goal_amount > 0" class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
          <p class="text-slate-500 text-sm mb-3">Savings Goal</p>
          <p class="text-xl font-semibold text-slate-800 mb-4">{{ wallet.goal_name }}</p>
          <div class="w-full bg-slate-200 rounded-full h-8 mb-3">
            <div
              class="bg-gradient-to-r from-green-500 to-emerald-600 h-8 rounded-full flex items-center justify-end pr-4 text-white font-bold transition-all"
              :style="{ width: goalProgress + '%' }"
            >
              {{ goalProgress.toFixed(0) }}%
            </div>
          </div>
          <div class="flex justify-between text-sm">
            <span>₦{{ Number(wallet.balance).toLocaleString() }}</span>
            <span class="font-medium">₦{{ Number(wallet.goal_amount).toLocaleString() }}</span>
          </div>
          <p class="text-xs text-slate-500 mt-2">Target: {{ formatDate(wallet.goal_target_date) }}</p>
        </div>

        <div v-else class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition cursor-pointer" @click="showGoalModal = true">
          <div class="text-6xl mb-4">🎯</div>
          <p class="font-semibold text-slate-800">No Goal Set</p>
          <p class="text-sm text-slate-600 mt-2">Click to create your first savings goal</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <button @click="showWithdrawModal = true" class="bg-white rounded-lg shadow p-5 text-center hover:shadow-md hover:cursor-pointer transition">
          <span class="text-3xl block mb-2 text-error">🏧</span>
          <p class="text-sm font-medium">Withdraw</p>
        </button>

        <button @click="showDepositModal = true" class="bg-white  rounded-lg shadow p-5 text-center hover:shadow-md hover:cursor-pointer transition">
          <span class="text-3xl block mb-2 text-success">💰</span>
          <p class="text-sm font-medium">Add Money</p>
        </button>

        <button @click="showGoalModal = true" class="bg-white rounded-lg shadow p-5 text-center hover:shadow-md hover:cursor-pointer transition ">
          <span class="text-3xl block mb-2 text-warning">🎯</span>
          <p class="text-sm font-medium">Set Goal</p>
        </button>

        <div class="bg-white rounded-lg shadow p-5 text-center hover:cursor-pointer hover:shadow-md">
          <span class="text-3xl block mb-2 text-primary">📊</span>
          <p class="text-sm font-medium">History</p>
        </div>
      </div>

      <!-- Transactions -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-semibold mb-5">Recent Transactions</h2>
        <div v-if="transactions.length === 0" class="text-center py-10">
          <span class="text-5xl opacity-20">🌱</span>
          <p class="text-slate-600 mt-4">No transactions yet</p>
        </div>
        <div v-else class="space-y-3">
          <div v-for="tx in transactions.slice(0, 6)" :key="tx.id" class="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div class="flex items-center gap-4">
              <span class="text-2xl" :class="tx.type === 'deposit' ? 'text-success' : 'text-error'">
                {{ tx.type === 'deposit' ? '↑' : '↓' }}
              </span>
              <div>
                <p class="font-medium">{{ tx.description || tx.type.toUpperCase() }}</p>
                <p class="text-xs text-slate-500">{{ formatDate(tx.created_at) }}</p>
              </div>
            </div>
            <p class="text-lg font-bold" :class="tx.type === 'deposit' ? 'text-success' : 'text-error'">
              {{ tx.type === 'deposit' ? '+' : '-' }}₦{{ Number(tx.amount).toLocaleString() }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import api from '~/utils/api'

const wallet = ref({ balance: 0, monthly_savings: 0, goal_amount: 0, goal_name: '', goal_target_date: null })
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

const goalProgress = computed(() => {
  if (wallet.value.goal_amount <= 0) return 0
  return Math.min(100, (wallet.value.balance / wallet.value.goal_amount) * 100)
})

const formatDate = (date: string | null) => {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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