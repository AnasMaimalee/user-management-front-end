<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
    <!-- Header -->
    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-10 px-6">
      <div class="max-w-6xl mx-auto text-center">
        <h1 class="text-3xl font-bold mb-2">My Savings Wallet</h1>
        <p class="text-base opacity-90">Secure savings that grow with every paycheck</p>
      </div>
    </div>

    <div class="max-w-6xl mx-auto px-6 -mt-6">
      <!-- Balance & Goal -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <!-- Balance -->
        <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition">
          <p class="text-slate-500 text-sm mb-2">Current Balance</p>
          <p class="text-5xl font-bold text-primary mb-6">
            ₦{{ Number(wallet.balance).toLocaleString('en-NG') }}
          </p>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <p class="text-slate-500 text-xs">Monthly Savings</p>
              <p class="text-2xl font-semibold text-success">
                ₦{{ Number(wallet.monthly_savings).toLocaleString() }}
              </p>
            </div>
            <div>
              <p class="text-slate-500 text-xs">Next Deposit</p>
              <p class="text-2xl font-semibold text-primary">
                {{ nextDepositDate }}
              </p>
            </div>
          </div>
        </div>

        <!-- Goal -->
        <div v-if="wallet.goal_amount > 0" class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition relative">
          <div class="flex justify-between items-start mb-4">
            <div>
              <p class="text-slate-500 text-sm">Active Goal</p>
              <p class="text-xl font-semibold text-slate-800">{{ wallet.goal_name }}</p>
            </div>
            <a-button type="text" size="small" @click="editGoal">
              <edit-outlined class="text-primary" />
            </a-button>
          </div>

          <a-progress
            :percent="goalProgress"
            type="circle"
            :width="140"
            :stroke-color="{ '0%': '#1677ff', '100%': '#52c41a' }"
            class="block mx-auto mb-4"
          >
            <template #format>
              <span class="text-2xl font-bold">{{ goalProgress.toFixed(0) }}%</span>
            </template>
          </a-progress>

          <div class="text-center">
            <p class="text-sm text-slate-500">
              ₦{{ Number(wallet.balance).toLocaleString() }} of ₦{{ Number(wallet.goal_amount).toLocaleString() }}
            </p>
            <p class="text-xs text-slate-500 mt-1">
              Target: {{ formatDate(wallet.goal_target_date) }}
            </p>
          </div>
        </div>

        <!-- No Goal -->
        <div v-else class="bg-white rounded-xl shadow-lg p-6 text-center hover:shadow-xl transition cursor-pointer" @click="showGoalModal = true">
          <div class="text-6xl mb-4 opacity-60">🎯</div>
          <p class="font-semibold text-slate-800 text-lg">No Active Goal</p>
          <p class="text-sm text-slate-600 mt-2">Set a goal to stay motivated</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        <button @click="showWithdrawModal = true" class="bg-white rounded-lg shadow p-5 text-center hover:shadow-md transition border">
          <span class="text-3xl block mb-2 text-error">🏧</span>
          <p class="text-sm font-medium">Withdraw</p>
        </button>

        <button @click="showDepositModal = true" class="bg-white rounded-lg shadow p-5 text-center hover:shadow-md transition border">
          <span class="text-3xl block mb-2 text-success">💰</span>
          <p class="text-sm font-medium">Add Money</p>
        </button>

        <button @click="showGoalModal = true" class="bg-white rounded-lg shadow p-5 text-center hover:shadow-md transition border">
          <span class="text-3xl block mb-2 text-warning">🎯</span>
          <p class="text-sm font-medium">Set Goal</p>
        </button>

        <div class="bg-white rounded-lg shadow p-5 text-center border">
          <span class="text-3xl block mb-2 text-primary">📊</span>
          <p class="text-sm font-medium">Analytics</p>
        </div>
      </div>

      <!-- Analytics Summary -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 class="text-xl font-semibold mb-5">Savings Summary</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div class="text-center">
            <p class="text-slate-500 text-xs">Total Saved (2025)</p>
            <p class="text-2xl font-bold text-primary">₦{{ totalSavedThisYear.toLocaleString() }}</p>
          </div>
          <div class="text-center">
            <p class="text-slate-500 text-xs">Average Monthly</p>
            <p class="text-2xl font-bold text-success">₦{{ averageMonthly.toLocaleString() }}</p>
          </div>
          <div class="text-center">
            <p class="text-slate-500 text-xs">Transactions</p>
            <p class="text-2xl font-bold text-blue-600">{{ transactions.length }}</p>
          </div>
          <div class="text-center">
            <p class="text-slate-500 text-xs">Goals Achieved</p>
            <p class="text-2xl font-bold text-green-600">{{ goalsAchieved }}</p>
          </div>
        </div>
      </div>

      <!-- Recent Transactions -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <div class="flex justify-between items-center mb-5">
          <h2 class="text-xl font-semibold">Recent Transactions</h2>
          <a-button type="link" class="text-primary">View All →</a-button>
        </div>

        <div v-if="transactions.length === 0" class="text-center py-12">
          <span class="text-6xl opacity-20">🌱</span>
          <p class="text-slate-600 mt-4 text-lg">Your journey begins soon</p>
          <p class="text-sm text-slate-500">Transactions will appear after payroll</p>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="tx in transactions.slice(0, 6)"
            :key="tx.id"
            class="flex items-center justify-between p-5 bg-slate-50 rounded-xl hover:bg-slate-100 transition"
          >
            <div class="flex items-center gap-5">
              <div class="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                :class="tx.type === 'deposit' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'"
              >
                {{ tx.type === 'deposit' ? '↑' : '↓' }}
              </div>
              <div>
                <p class="font-medium text-slate-800">{{ tx.description || tx.type.toUpperCase() }}</p>
                <p class="text-sm text-slate-500">{{ formatDate(tx.created_at) }}</p>
              </div>
            </div>

            <p class="text-2xl font-bold" :class="tx.type === 'deposit' ? 'text-success' : 'text-error'">
              {{ tx.type === 'deposit' ? '+' : '-' }}₦{{ Number(tx.amount).toLocaleString() }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Withdrawal Modal -->
    <a-modal v-model:open="showWithdrawModal" title="Request Withdrawal" width="500px">
      <div class="text-center mb-6">
        <p class="text-slate-600">Available Balance</p>
        <p class="text-4xl font-bold text-primary mt-2">
          ₦{{ Number(wallet.balance).toLocaleString('en-NG') }}
        </p>
      </div>

      <a-form layout="vertical">
        <a-form-item label="Amount (₦)">
          <a-input-number
            v-model:value="withdrawal.amount"
            :min="1000"
            :max="wallet.balance"
            class="w-full"
            size="large"
          />
        </a-form-item>

        <a-form-item label="Reason">
          <a-textarea v-model:value="withdrawal.reason" :rows="3" size="large" />
        </a-form-item>
      </a-form>

      <template #footer>
        <a-button @click="showWithdrawModal = false">Cancel</a-button>
        <a-button type="primary" :loading="submittingWithdrawal" @click="submitWithdrawal">
          Submit Request
        </a-button>
      </template>
    </a-modal>

    <!-- Goal Modal -->
    <a-modal
      v-model:open="showGoalModal"
      :title="wallet.goal_amount > 0 ? 'Update Savings Goal' : 'Create Savings Goal'"
      width="600px"
    >
      <a-form
        ref="goalFormRef"
        :model="goal"
        :rules="goalRules"
        layout="vertical"
        @submit.prevent="submitGoal"
      >
        <a-form-item name="name" label="Goal Name" required>
          <a-input
            v-model:value="goal.name"
            placeholder="e.g., Vacation Fund, New Phone, Emergency"
            size="large"
          />
        </a-form-item>

        <a-form-item name="amount" label="Target Amount (₦)" required>
          <a-input-number
            v-model:value="goal.amount"
            :min="1000"
            :formatter="value => value ? `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''"
            :parser="value => value.replace(/\₦\s?|(,*)/g, '')"
            class="w-full"
            size="large"
            placeholder="Minimum ₦1,000"
          />
        </a-form-item>

        <a-form-item name="date" label="Target Date" required>
          <a-date-picker
            v-model:value="goal.date"
            :disabled-date="disabledDate"
            class="w-full"
            size="large"
            placeholder="Select target date"
          />
        </a-form-item>
      </a-form>

      <template #footer>
        <a-button @click="resetGoalForm">Cancel</a-button>
        <a-button
          type="primary"
          :loading="savingGoal"
          @click="goalFormRef?.validate().then(submitGoal).catch(() => {})"
        >
          {{ wallet.goal_amount > 0 ? 'Update' : 'Create' }} Goal
        </a-button>
      </template>
    </a-modal>

    <!-- Goal Achievement Celebration -->
    <a-modal v-model:open="showAchievement" :footer="null" width="500px" :closable="false">
      <div class="text-center py-10">
        <div class="text-7xl mb-6">🎉</div>
        <h2 class="text-3xl font-bold text-success mb-4">Goal Achieved!</h2>
        <p class="text-xl text-slate-700 mb-8">
          Congratulations on reaching "{{ wallet.goal_name }}"!
        </p>
        <a-button type="primary" size="large" @click="showAchievement = false">
          Thank You!
        </a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'
import { EditOutlined } from '@ant-design/icons-vue'
import type { FormInstance } from 'ant-design-vue'

const wallet = ref({
  balance: 0,
  monthly_savings: 0,
  goal_name: '',
  goal_amount: 0,
  goal_target_date: null,
})

const transactions = ref<any[]>([])

const showWithdrawModal = ref(false)
const showDepositModal = ref(false)
const showGoalModal = ref(false)
const showAchievement = ref(false)

const withdrawal = ref({ amount: null as number | null, reason: '' })
const submittingWithdrawal = ref(false)

const goalFormRef = ref<FormInstance>()

const goal = reactive({
  name: '',
  amount: null as number | null,
  date: null as string | null,
})

const goalRules = {
  name: [{ required: true, message: 'Goal name is required', trigger: 'blur' }],
  amount: [
    { required: true, message: 'Target amount is required', trigger: 'change' },
    { type: 'number', min: 1000, message: 'Amount must be at least ₦1,000', trigger: 'change' },
  ],
  date: [{ required: true, message: 'Target date is required', trigger: 'change' }],
}

const savingGoal = ref(false)

const nextDepositDate = computed(() => {
  const date = new Date()
  date.setMonth(date.getMonth() + 1)
  date.setDate(1)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
})

const goalProgress = computed(() => {
  if (!wallet.value.goal_amount || wallet.value.goal_amount <= 0) return 0
  return Math.min(100, Math.round((wallet.value.balance / wallet.value.goal_amount) * 100))
})

const totalSavedThisYear = computed(() => {
  const thisYear = new Date().getFullYear()
  return transactions.value
    .filter(tx => tx.type === 'deposit' && new Date(tx.created_at).getFullYear() === thisYear)
    .reduce((sum, tx) => sum + tx.amount, 0)
})

const averageMonthly = computed(() => {
  return Math.round(totalSavedThisYear.value / 12)
})

const goalsAchieved = computed(() => goalProgress.value >= 100 ? 1 : 0)

const disabledDate = (current: any) => current && current < new Date().setHours(0, 0, 0, 0)

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

const editGoal = () => {
  goal.name = wallet.value.goal_name || ''
  goal.amount = wallet.value.goal_amount || null
  goal.date = wallet.value.goal_target_date || null
  showGoalModal.value = true
}

const resetGoalForm = () => {
  showGoalModal.value = false
  goalFormRef.value?.resetFields()
  goal.name = ''
  goal.amount = null
  goal.date = null
}

const submitWithdrawal = async () => {
  if (!withdrawal.value.amount || withdrawal.value.amount < 1000 || !withdrawal.value.reason.trim()) {
    notification.error({ message: 'Please fill all fields correctly' })
    return
  }

  submittingWithdrawal.value = true
  try {
    await api.post('/wallet/withdraw', withdrawal.value)
    notification.success({ message: 'Withdrawal request submitted!' })
    showWithdrawModal.value = false
    withdrawal.value = { amount: null, reason: '' }
    fetchWallet()
  } catch (err: any) {
    notification.error({ message: err.response?.data?.message || 'Request failed' })
  } finally {
    submittingWithdrawal.value = false
  }
}

const submitGoal = async () => {
  try {
    await goalFormRef.value?.validate()

    savingGoal.value = true

    await api.post('/wallet/goal', {
      goal_name: goal.name.trim(),
      goal_amount: goal.amount,
      goal_target_date: goal.date,
    })

    notification.success({ message: 'Goal saved successfully!' })
    showGoalModal.value = false
    resetGoalForm()
    fetchWallet()
  } catch (err: any) {
    if (err.errorFields) return // Validation errors shown by Ant
    notification.error({ message: err.response?.data?.message || 'Failed to save goal' })
  } finally {
    savingGoal.value = false
  }
}

// Achievement Celebration
watch(goalProgress, (newVal, oldVal) => {
  if (newVal >= 100 && (oldVal || 0) < 100) {
    showAchievement.value = true
  }
})

onMounted(fetchWallet)
</script>

<style scoped>
.max-w-6xl {
  max-width: 1150px;
}
</style>