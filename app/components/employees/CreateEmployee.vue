<template>
  <a-modal
    v-model:open="localOpen"
    title="Create Employee"
    @cancel="handleClose"
    @ok="submit"
    :confirm-loading="submitting"
  >
    <a-form layout="vertical">
      
      <!-- Auto-generated Employee Code (Preview only) -->
      <a-form-item label="Employee Code" required>
        <a-input
          :value="employeeCodePreview"
          disabled
          :placeholder="employeeCodePreview === 'Loading...' ? 'Loading...' : 'Auto-generated'"
          class="bg-gray-50"
        />
      </a-form-item>

      <!-- Required Fields -->
      <a-form-item label="First Name" required>
        <a-input v-model:value="firstName" placeholder="Enter first name" />
      </a-form-item>

      <a-form-item label="Last Name" required>
        <a-input v-model:value="lastName" placeholder="Enter last name" />
      </a-form-item>

      <a-form-item label="Email" required>
        <a-input v-model:value="email" type="email" placeholder="Enter email address" />
      </a-form-item>
      <a-form-item label="Role" required>
        <a-select v-model:value="role" placeholder="Select role">
          <a-select-option value="staff">Staff</a-select-option>
          <a-select-option value="admin">Admin</a-select-option>
        </a-select>
      </a-form-item>
      <!-- Optional Selects -->
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

    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits(['close', 'created'])

const localOpen = ref(false)
const submitting = ref(false)

const employeeCodePreview = ref('Loading...')

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const role = ref<'staff' | 'admin'>('staff')

const departmentId = ref<string | null>(null)
const rankId = ref<string | null>(null)
const branchId = ref<string | null>(null)

// Data
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
    // Refresh next code every time modal opens (in case someone else created one)
    fetchNextEmployeeCode()
  }
})

// Fetch next employee code preview
const fetchNextEmployeeCode = async () => {
  employeeCodePreview.value = 'Loading...'
  try {
    const res = await api.get('/employees/next-code')
    employeeCodePreview.value = res.data.code || 'EMP-??'
  } catch (err) {
    console.error('Failed to fetch next employee code:', err)
    employeeCodePreview.value = 'EMP-??'
  }
}

// Fetch dropdown data
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
    ranks.value = []
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
    branches.value = []
  } finally {
    loadingBranches.value = false
  }
}

// Load data once on mount
watch(localOpen, (isOpen) => {
  if (isOpen) {
    fetchDepartments()
    fetchRanks()
    fetchBranches()
  }
}, { immediate: true })

const handleClose = () => emit('close')

const submit = async () => {
  const trimmedFirstName = firstName.value.trim()
  const trimmedLastName = lastName.value.trim()
  const trimmedEmail = email.value.trim()


  if (!role.value) {
  notification.error({
    message: 'Role Required',
    description: 'Please select a role.',
  })
  return
}

  // Only validate the actual required fields
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
    role: role.value, // ✅ added
    department_id: departmentId.value || null,
    rank_id: rankId.value || null,
    branch_id: branchId.value || null,
  }


  try {
    const res = await api.post('/employees', payload)

    notification.success({
      message: 'Success!',
      description: 'Employee created successfully.',
    })

    emit('created')
    emit('close')

    // Reset form
    firstName.value = ''
    lastName.value = ''
    email.value = ''
    departmentId.value = null
    rankId.value = null
    branchId.value = null
  } catch (err: any) {
    console.error('Employee creation failed:', err)

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
        message: 'Failed',
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