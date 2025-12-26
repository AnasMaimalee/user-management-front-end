<template>
  <a-modal
    v-model:open="localOpen"
    title="Create Employee"
    @cancel="handleClose"
    @ok="submit"
    :confirm-loading="submitting"
    width="700px"
  >
    <a-form layout="vertical">
      <!-- Auto-generated Employee Code (Preview only) -->
      <a-form-item label="Employee Code">
        <a-input
          :value="employeeCodePreview"
          disabled
          :placeholder="employeeCodePreview === 'Loading...' ? 'Loading...' : 'Auto-generated'"
          class="bg-gray-50"
        />
        <div class="text-xs text-gray-500 mt-1">This will be assigned automatically upon creation</div>
      </a-form-item>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Left Column -->
        <div class="space-y-4">
          <a-form-item label="First Name" required>
            <a-input v-model:value="employee.first_name" placeholder="Enter first name" />
          </a-form-item>

          <a-form-item label="Last Name" required>
            <a-input v-model:value="employee.last_name" placeholder="Enter last name" />
          </a-form-item>

          <a-form-item label="Email" required>
            <a-input v-model:value="employee.email" type="email" placeholder="Enter email address" />
          </a-form-item>

          <a-form-item label="Role" required>
            <a-select v-model:value="employee.role" placeholder="Select role">
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
              v-model:value="employee.department_id"
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
              v-model:value="employee.rank_id"
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
              v-model:value="employee.branch_id"
              placeholder="Select branch"
              allow-clear
              :loading="loadingBranches"
            >
              <a-select-option v-for="branch in branches" :key="branch.id" :value="branch.id">
                {{ branch.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </div>
      </div>

      <!-- Salary Section -->
      <div class="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <h3 class="text-lg font-semibold text-slate-800 mb-6">Salary & Savings Settings</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <a-form-item label="Basic Salary (₦)">
            <a-input-number
              v-model:value="employee.basic_salary"
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
              v-model:value="employee.allowances"
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
              v-model:value="employee.deductions"
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
              v-model:value="employee.monthly_savings"
              :min="0"
              :step="1000"
              :formatter="value => value ? `₦ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''"
              :parser="value => value.replace(/\₦\s?|(,*)/g, '')"
              class="w-full"
              placeholder="0"
            />
            <div class="text-sm text-slate-600 mt-1">
              Amount automatically deducted monthly and added to employee's savings wallet
            </div>
          </a-form-item>
        </div>
      </div>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, reactive } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits(['close', 'created'])

const localOpen = ref(false)
const submitting = ref(false)
const employeeCodePreview = ref('Loading...')

// Reactive employee object with all fields
const employee = reactive({
  first_name: '',
  last_name: '',
  email: '',
  role: 'staff' as 'staff' | 'admin' | 'hr',
  department_id: null as string | null,
  rank_id: null as string | null,
  branch_id: null as string | null,
  basic_salary: 0,
  allowances: 0,
  deductions: 0,
  monthly_savings: 0,
})

// Dropdown data
const departments = ref<Array<{ id: string; name: string }>>([])
const ranks = ref<Array<{ id: string; name: string }>>([])
const branches = ref<Array<{ id: string; name: string }>>([])

const loadingDepartments = ref(false)
const loadingRanks = ref(false)
const loadingBranches = ref(false)

// Sync modal open state
watch(() => props.open, (val) => {
  localOpen.value = val
  if (val) {
    fetchNextEmployeeCode()
    fetchDepartments()
    fetchRanks()
    fetchBranches()
    // Reset form
    Object.assign(employee, {
      first_name: '',
      last_name: '',
      email: '',
      role: 'staff',
      department_id: null,
      rank_id: null,
      branch_id: null,
      basic_salary: 0,
      allowances: 0,
      deductions: 0,
      monthly_savings: 0,
    })
  }
})

// Fetch next employee code
const fetchNextEmployeeCode = async () => {
  employeeCodePreview.value = 'Loading...'
  try {
    const res = await api.get('/employees/next-code')
    employeeCodePreview.value = res.data.code || 'EMP-??'
  } catch {
    employeeCodePreview.value = 'EMP-??'
  }
}

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
    ranks.value = Array.isArray(res.data) ? res.data : res.data.data || []
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
  emit('close')
}

const submit = async () => {
  const trimmedFirstName = employee.first_name.trim()
  const trimmedLastName = employee.last_name.trim()
  const trimmedEmail = employee.email.trim()

  if (!trimmedFirstName || !trimmedLastName || !trimmedEmail) {
    notification.error({
      message: 'Required Fields',
      description: 'First Name, Last Name, and Email are required.',
    })
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    notification.error({
      message: 'Invalid Email',
      description: 'Please enter a valid email address.',
    })
    return
  }

  submitting.value = true

  try {
    await api.post('/employees', {
      first_name: trimmedFirstName,
      last_name: trimmedLastName,
      email: trimmedEmail,
      role: employee.role,
      department_id: employee.department_id,
      rank_id: employee.rank_id,
      branch_id: employee.branch_id,
      basic_salary: employee.basic_salary || 0,
      allowances: employee.allowances || 0,
      deductions: employee.deductions || 0,
      monthly_savings: employee.monthly_savings || 0,
    })

    notification.success({
      message: 'Employee Created!',
      description: 'New employee added successfully with salary settings.',
    })

    emit('created')
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
        message: 'Creation Failed',
        description: serverMessage,
      })
    } else {
      notification.error({
        message: 'Error',
        description: 'Could not create employee. Please try again.',
      })
    }
  } finally {
    submitting.value = false
  }
}
</script>