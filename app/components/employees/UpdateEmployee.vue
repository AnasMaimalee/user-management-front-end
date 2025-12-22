<template>
  <a-modal
    v-model:open="localOpen"
    title="Update Employee"
    @cancel="handleClose"
    @ok="submit"
    :confirm-loading="submitting"
    width="600px"
  >
    <a-form layout="vertical">
      
      <!-- Employee Code (Read-only) -->
      <a-form-item label="Employee Code" required>
        <a-input
          :value="employee.employee_code"
          disabled
          class="bg-gray-50"
          placeholder="Cannot be changed"
        />
      </a-form-item>

      <!-- First Name -->
      <a-form-item label="First Name" required>
        <a-input v-model:value="firstName" placeholder="Enter first name" />
      </a-form-item>

      <!-- Last Name -->
      <a-form-item label="Last Name" required>
        <a-input v-model:value="lastName" placeholder="Enter last name" />
      </a-form-item>

      <!-- Email -->
      <a-form-item label="Email" required>
        <a-input v-model:value="email" type="email" placeholder="Enter email address" />
      </a-form-item>

      <!-- Department -->
      <a-form-item label="Department">
        <a-select
          v-model:value="departmentId"
          placeholder="Select a department"
          allow-clear
          :loading="loadingDepartments"
        >
          <a-select-option v-for="dept in departments" :key="dept.id" :value="dept.id">
            {{ dept.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- Rank -->
      <a-form-item label="Rank">
        <a-select
          v-model:value="rankId"
          placeholder="Select a rank"
          allow-clear
          :loading="loadingRanks"
        >
          <a-select-option v-for="rank in ranks" :key="rank.id" :value="rank.id">
            {{ rank.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- Branch -->
      <a-form-item label="Branch">
        <a-select
          v-model:value="branchId"
          placeholder="Select a branch"
          allow-clear
          :loading="loadingBranches"
        >
          <a-select-option v-for="branch in branches" :key="branch.id" :value="branch.id">
            {{ branch.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- Status -->
      <a-form-item label="Status">
        <a-select v-model:value="status" placeholder="Select status">
          <a-select-option value="active">Active</a-select-option>
          <a-select-option value="inactive">Inactive</a-select-option>
        </a-select>
      </a-form-item>

    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
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
    department_id: string | null
    rank_id: string | null
    branch_id: string | null
    status: string
    department?: { id: string; name: string }
    rank?: { id: string; name: string }
    branch?: { id: string; name: string }
  } | null
}>()

const emit = defineEmits(['close', 'updated'])

const localOpen = ref(false)
const submitting = ref(false)

// Form fields
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const departmentId = ref<string | null>(null)
const rankId = ref<string | null>(null)
const branchId = ref<string | null>(null)
const status = ref<'active' | 'inactive'>('active')

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
  if (val && props.employee) {
    // Pre-fill form when modal opens
    firstName.value = props.employee.first_name
    lastName.value = props.employee.last_name
    email.value = props.employee.email
    departmentId.value = props.employee.department_id
    rankId.value = props.employee.rank_id
    branchId.value = props.employee.branch_id
    status.value = props.employee.status as 'active' | 'inactive'
  }
})

// Fetch dropdown options
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
    let rankList = []
    if (Array.isArray(res.data)) {
      rankList = res.data.flat()
    } else if (res.data?.data) {
      rankList = Array.isArray(res.data.data) ? res.data.data.flat() : []
    }
    ranks.value = rankList
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

// Load options when modal opens
watch(localOpen, (isOpen) => {
  if (isOpen) {
    fetchDepartments()
    fetchRanks()
    fetchBranches()
  }
})

const handleClose = () => {
  emit('close')
  // Reset form
  firstName.value = ''
  lastName.value = ''
  email.value = ''
  departmentId.value = null
  rankId.value = null
  branchId.value = null
  status.value = 'active'
}

const submit = async () => {
  const trimmedFirstName = firstName.value.trim()
  const trimmedLastName = lastName.value.trim()
  const trimmedEmail = email.value.trim()

  if (!trimmedFirstName || !trimmedLastName || !trimmedEmail) {
    notification.error({
      message: 'Required Fields Missing',
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

  const payload = {
    first_name: trimmedFirstName,
    last_name: trimmedLastName,
    email: trimmedEmail,
    department_id: departmentId.value || null,
    rank_id: rankId.value || null,
    branch_id: branchId.value || null,
    status: status.value,
  }

  try {
    await api.put(`/employees/${props.employee?.id}`, payload)

    notification.success({
      message: 'Success',
      description: 'Employee updated successfully!',
    })

    emit('updated')
    emit('close')
    handleClose() // reset form
  } catch (err: any) {
    console.error('Update failed:', err)
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