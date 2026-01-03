<template>
  <a-modal
    v-model:open="localOpen"
    title="Update Employee"
    @cancel="handleClose"
    @ok="submit"
    :confirm-loading="submitting"
    width="700px"
  >
    <a-form layout="vertical">
      <!-- Employee Code (Read-only) -->
      <a-form-item label="Employee Code" required>
        <a-input
          :value="props.employee?.employee_code"
          disabled
          class="bg-gray-50"
        />
      </a-form-item>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Left Column -->
        <div class="space-y-4">
          <a-form-item label="First Name" required>
            <a-input v-model:value="firstName" placeholder="Enter first name" />
          </a-form-item>

          <a-form-item label="Last Name" required>
            <a-input v-model:value="lastName" placeholder="Enter last name" />
          </a-form-item>

          <!-- Email - Read Only -->
          <a-form-item label="Email" required>
            <a-input
              :value="email"
              class="bg-gray-50"
              placeholder="Email cannot be changed"
            />
          </a-form-item>

          <a-form-item label="Role" required>
            <a-select v-model:value="role" placeholder="Select role">
              <a-select-option value="staff">Staff</a-select-option>
              <a-select-option value="admin">Admin</a-select-option>
              <a-select-option value="hr">HR</a-select-option>
            </a-select>
          </a-form-item>
        </div>

        <!-- Right Column -->
        <div class="space-y-4">
          <a-form-item label="Department">
            <a-select
              v-model:value="departmentId"
              placeholder="Select department"
              allow-clear
              :loading="loadingDepartments"
            >
              <a-select-option v-for="dept in departments" :key="dept.id" :value="dept.id">
                {{ dept.name }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Rank">
            <a-select
              v-model:value="rankId"
              placeholder="Select rank"
              allow-clear
              :loading="loadingRanks"
            >
              <a-select-option v-for="rank in ranks" :key="rank.id" :value="rank.id">
                {{ rank.name }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Branch">
            <a-select
              v-model:value="branchId"
              placeholder="Select branch"
              allow-clear
              :loading="loadingBranches"
            >
              <a-select-option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="Status">
            <a-select v-model:value="status" placeholder="Select status">
              <a-select-option value="active">Active</a-select-option>
              <a-select-option value="inactive">Inactive</a-select-option>
            </a-select>
          </a-form-item>
        </div>
      </div>

      <!-- Salary & Savings Section -->
      <div class="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <h3 class="text-lg font-semibold text-slate-800 mb-6">Salary & Savings Settings</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a-form-item label="Basic Salary (₦)">
            <a-input-number
              v-model:value="basicSalary"
              :min="0"
              :step="1000"
              :formatter="value => value ? `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''"
              :parser="value => value.replace(/\₦\s?|(,*)/g, '')"
              class="w-full"
              placeholder="0"
            />
          </a-form-item>

          <a-form-item label="Allowances (₦)">
            <a-input-number
              v-model:value="allowances"
              :min="0"
              :step="1000"
              :formatter="value => value ? `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''"
              :parser="value => value.replace(/\₦\s?|(,*)/g, '')"
              class="w-full"
              placeholder="0"
            />
          </a-form-item>

          <a-form-item label="Deductions (₦)">
            <a-input-number
              v-model:value="deductions"
              :min="0"
              :step="1000"
              :formatter="value => value ? `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''"
              :parser="value => value.replace(/\₦\s?|(,*)/g, '')"
              class="w-full"
              placeholder="0"
            />
          </a-form-item>

          <a-form-item label="Monthly Savings Deduction (₦)">
            <a-input-number
              v-model:value="monthlySavings"
              :min="0"
              :step="1000"
              :formatter="value => value ? `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''"
              :parser="value => value.replace(/\₦\s?|(,*)/g, '')"
              class="w-full"
              placeholder="0"
            />
            <div class="text-sm text-slate-600 mt-1">
              Amount automatically deducted monthly and added to savings wallet
            </div>
          </a-form-item>
        </div>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

const props = defineProps<{
  open: boolean
  employee: {
    id: string
    employee_code: string
    first_name: string
    last_name: string
    email: string
    role: 'staff' | 'admin' | 'hr'
    department_id: string | null
    rank_id: string | null
    branch_id: string | null
    status: 'active' | 'inactive'
    basic_salary?: number
    allowances?: number
    deductions?: number
    monthly_savings?: number
  } | null
}>()

const emit = defineEmits(['update:open', 'close', 'updated'])

const localOpen = ref(false)
const submitting = ref(false)

// Form fields
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const role = ref<'staff' | 'admin' | 'hr'>('staff')
const departmentId = ref<string | null>(null)
const rankId = ref<string | null>(null)
const branchId = ref<string | null>(null)
const status = ref<'active' | 'inactive'>('active')

// Salary fields
const basicSalary = ref(0)
const allowances = ref(0)
const deductions = ref(0)
const monthlySavings = ref(0)

// Dropdown data
const departments = ref<Array<{ id: string; name: string }>>([])
const ranks = ref<Array<{ id: string; name: string }>>([])
const branches = ref<Array<{ id: string; name: string }>>([])

const loadingDepartments = ref(false)
const loadingRanks = ref(false)
const loadingBranches = ref(false)

// Sync open state and pre-fill form
watch(() => props.open, (val) => {
  localOpen.value = val
  if (val && props.employee) {
    firstName.value = props.employee.first_name
    lastName.value = props.employee.last_name
    email.value = props.employee.email
    role.value = props.employee.role
    departmentId.value = props.employee.department_id
    rankId.value = props.employee.rank_id
    branchId.value = props.employee.branch_id
    status.value = props.employee.status as 'active' | 'inactive'

    // Salary fields
    basicSalary.value = props.employee.basic_salary || 0
    allowances.value = props.employee.allowances || 0
    deductions.value = props.employee.deductions || 0
    monthlySavings.value = props.employee.monthly_savings || 0
  }
})

watch(localOpen, (val) => {
  emit('update:open', val)
  if (val) {
    fetchDepartments()
    fetchRanks()
    fetchBranches()
  }
})

const fetchDepartments = async () => {
  loadingDepartments.value = true
  try {
    const res = await api.get('/departments')
    departments.value = res.data
  } catch {
    notification.error({ message: 'Failed to load departments' })
  } finally {
    loadingDepartments.value = false
  }
}

const fetchRanks = async () => {
  loadingRanks.value = true
  try {
    const res = await api.get('/ranks')
    ranks.value = Array.isArray(res.data?.[0]) ? res.data[0] : res.data
  } catch {
    notification.error({ message: 'Failed to load ranks' })
  } finally {
    loadingRanks.value = false
  }
}

const fetchBranches = async () => {
  loadingBranches.value = true
  try {
    const res = await api.get('/branches')
    branches.value = res.data || []
  } catch {
    notification.error({ message: 'Failed to load branches' })
  } finally {
    loadingBranches.value = false
  }
}

const handleClose = () => {
  emit('update:open', false)
  emit('close')
}

const submit = async () => {
  const trimmedFirstName = firstName.value.trim()
  const trimmedLastName = lastName.value.trim()

  if (!trimmedFirstName || !trimmedLastName) {
    notification.error({
      message: 'Required Fields Missing',
      description: 'First Name and Last Name are required.',
    })
    return
  }

  submitting.value = true

  const payload = {
    first_name: trimmedFirstName,
    last_name: trimmedLastName,
    role: role.value,
    email: email.value,
    department_id: departmentId.value || null,
    rank_id: rankId.value || null,
    branch_id: branchId.value || null,
    status: status.value,
    basic_salary: basicSalary.value || 0,
    allowances: allowances.value || 0,
    deductions: deductions.value || 0,
    monthly_savings: monthlySavings.value || 0,
  }

  try {
    await api.put(`/employees/${props.employee?.id}`, payload)

    notification.success({
      message: 'Success',
      description: 'Employee updated successfully!',
    })

    emit('updated')
    emit('update:open', false)
    emit('close')
  } catch (err: any) {
    const serverMessage = err.response?.data?.message
    const errors = err.response?.data?.errors

    if (errors) {
      const errorMessages = Object.values(errors).flat().join('<br>')
      notification.error({
        message: 'Validation Error',
        description: errorMessages,
        duration: 8,
      })
    } else if (serverMessage) {
      notification.error({
        message: 'Update Failed',
        description: serverMessage,
      })
    } else {
      notification.error({
        message: 'Error',
        description: 'Failed to update employee.',
      })
    }
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.ant-form-item {
  margin-bottom: 20px;
}
</style>