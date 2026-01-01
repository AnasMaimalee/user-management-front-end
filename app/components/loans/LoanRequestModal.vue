<template>
  <a-modal
    v-model:open="showModal"
    title="Request New Loan"
    width="680px"
    centered
    :footer="null"
    destroy-on-close
  >
    <a-form layout="vertical" class="mt-4">
      <!-- Loan Amount – Text Input with ₦ on the left -->
      <a-form-item label="Loan Amount (₦)" required>
        <a-input
          v-model:value="loanForm.amount"
          placeholder="e.g. 500000"
          size="large"
          class="w-full"
          addon-before="₦"
          @input="formatAmount"
        />
        <p class="text-xs text-slate-500 mt-2">
          Type only numbers. Commas will be added automatically.
        </p>
      </a-form-item>

      <!-- Repayment Period -->
      <a-form-item label="Repayment Period (Months)" required>
        <a-input-number
          v-model:value="loanForm.months"
          :min="3"
          :max="36"
          placeholder="e.g. 12"
          class="w-full"
          size="large"
        />
        <p class="text-sm text-slate-600 mt-3 font-medium">
          Estimated Monthly Deduction:
          <span class="text-indigo-600 font-bold">
            ₦{{ formattedMonthlyDeduction }}
          </span>
        </p>
      </a-form-item>

      <!-- Reason -->
      <a-form-item label="Reason for Loan" required>
        <a-textarea
          v-model:value="loanForm.reason"
          placeholder="Explain why you need this loan..."
          :rows="5"
          size="large"
          show-count
          :max-length="1000"
        />
      </a-form-item>

      <!-- Buttons -->
      <div class="flex justify-end gap-4 mt-10">
        <a-button size="large" @click="showModal = false">
          Cancel
        </a-button>
        <a-button
          type="primary"
          size="large"
          :loading="submitting"
          @click="submitLoanRequest"
          class="px-10"
        >
          Submit Request
        </a-button>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

// Modal visibility (controlled from parent)
const showModal = ref(false)
const submitting = ref(false)

// Form state
const loanForm = ref({
  amount: '' as string,
  months: null as number | null,
  reason: '',
})

// Format amount with commas as user types
const formatAmount = () => {
  let value = loanForm.value.amount.replace(/,/g, '')
  value = value.replace(/\D/g, '') // keep only digits

  if (value === '') {
    loanForm.value.amount = ''
  } else {
    loanForm.value.amount = Number(value).toLocaleString()
  }
}

// Monthly deduction preview
const formattedMonthlyDeduction = computed(() => {
  if (!loanForm.value.amount || !loanForm.value.months) return '0'
  const clean = parseInt(loanForm.value.amount.replace(/,/g, ''), 10)
  if (isNaN(clean)) return '0'
  return Math.round(clean / loanForm.value.months).toLocaleString()
})

// Submit loan request
const submitLoanRequest = async () => {
  if (!loanForm.value.amount || !loanForm.value.months || !loanForm.value.reason.trim()) {
    notification.error({ message: 'Please fill all required fields' })
    return
  }

  const cleanAmount = parseInt(loanForm.value.amount.replace(/,/g, ''), 10)
  if (isNaN(cleanAmount) || cleanAmount < 10000 || cleanAmount > 5000000) {
    notification.error({ message: 'Amount must be between ₦10,000 and ₦5,000,000' })
    return
  }

  submitting.value = true
  try {
    await api.post('/loans/request', {
      amount: cleanAmount,
      months: loanForm.value.months,
      reason: loanForm.value.reason.trim(),
    })

    notification.success({
      message: 'Success!',
      description: 'Your loan request has been submitted.'
    })

    showModal.value = false
    loanForm.value = { amount: '', months: null, reason: '' }
  } catch (err: any) {
    notification.error({
      message: 'Submission failed',
      description: err.response?.data?.message || 'Please try again'
    })
  } finally {
    submitting.value = false
  }
}
</script>