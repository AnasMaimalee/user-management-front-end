<template>
  <a-modal
    v-model:open="localOpen"
    title="Create Employee"
    @cancel="handleClose"
    @ok="submit"
  >
    <a-form layout="vertical">
      
      <a-form-item label="Employee Code" required>
        <a-input v-model:value="employeeCode" placeholder="Enter employee code" />
      </a-form-item>

      <a-form-item label="First Name" required>
        <a-input v-model:value="firstName" placeholder="Enter first name" />
      </a-form-item>

      <a-form-item label="Last Name" required>
        <a-input v-model:value="lastName" placeholder="Enter last name" />
      </a-form-item>

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
          <a-select-option
            v-for="dept in departments"
            :key="dept.id"
            :value="dept.id"
          >
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
          <a-select-option
            v-for="rank in ranks"
            :key="rank.id"
            :value="rank.id"
          >
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
          <a-select-option
            v-for="branch in branches"
            :key="branch.id"
            :value="branch.id"
          >
            {{ branch.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits(['close', 'created'])

const localOpen = ref(false)
const employeeCode = ref('')
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const departmentId = ref<string | null>(null)
const rankId = ref<string | null>(null)
const branchId = ref<string | null>(null)

// Data arrays
const departments = ref<Array<{ id: string; name: string }>>([])
const ranks = ref<Array<{ id: string; name: string }>>([])

const branches = ref<Array<{ id: string; name: string }>>([])

const loadingDepartments = ref(false)
const loadingRanks = ref(false)
const loadingBranches = ref(false)

watch(
  () => props.open,
  (val) => (localOpen.value = val)
)

// Fetch functions
const fetchDepartments = async () => {
  loadingDepartments.value = true
  try {
    const res = await api.get('/departments')
    departments.value = res.data
  } catch (err: any) {
    notification.error({ message: 'Failed to fetch departments' })
  } finally {
    loadingDepartments.value = false
  }
}

const fetchRanks = async () => {
  loadingRanks.value = true
  try {
    const res = await api.get('/ranks')
    
    console.log('Ranks API response:', res.data)

    // Safely extract the array of ranks
    let rankList = []

    if (Array.isArray(res.data)) {
      // Case: direct array or [[...]]
      rankList = res.data.flat()
    } else if (res.data?.data) {
      // Case: { data: [...] } or { data: [[...]] }
      rankList = Array.isArray(res.data.data) ? res.data.data.flat() : []
    } else {
      rankList = []
    }

    ranks.value = rankList

    console.log('Processed ranks:', ranks.value) // Should now show flat array

  } catch (err: any) {
    console.error('Rank fetch error:', err)
    ranks.value = []
    notification.error({ message: 'Failed to fetch ranks' })
  } finally {
    loadingRanks.value = false
  }
}



const fetchBranches = async () => {
  loadingBranches.value = true
  try {
    const res = await api.get('/branches') // update endpoint later
    branches.value = res.data || []
  } catch (err: any) {
    branches.value = []
  } finally {
    loadingBranches.value = false
  }
}

onMounted(() => {
  fetchDepartments()
  fetchRanks()
  fetchBranches()
})

const handleClose = () => emit('close')
const submit = async () => {
  // 1. Trim all inputs first to avoid whitespace issues
  const trimmedEmployeeCode = employeeCode.value.trim()
  const trimmedFirstName = firstName.value.trim()
  const trimmedLastName = lastName.value.trim()
  const trimmedEmail = email.value.trim()

  // 2. Required fields validation
  if (
    !trimmedEmployeeCode ||
    !trimmedFirstName ||
    !trimmedLastName ||
    !trimmedEmail
  ) {
    notification.error({
      message: 'Required Fields Missing',
      description: 'Employee Code, First Name, Last Name, and Email are all required.',
    })
    return
  }

  // 3. Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    notification.error({
      message: 'Invalid Email',
      description: 'Please enter a valid email address (e.g., user@example.com).',
    })
    return
  }

  // 4. Optional: You can add more specific rules here later
  // e.g., employee code format: if ( !/^EMP-\d{3,}$/.test(trimmedEmployeeCode) ) { ... }

  // 5. Prepare payload
  const payload = {
    employee_code: trimmedEmployeeCode,
    first_name: trimmedFirstName,
    last_name: trimmedLastName,
    email: trimmedEmail,
    department_id: departmentId.value || null,  // null if not selected
    rank_id: rankId.value || null,
    branch_id: branchId.value || null,
  }

  // 6. Submit to backend
  try {
    await api.post('/employees', payload)

    notification.success({
      message: 'Success',
      description: 'Employee created successfully!',
    })

    // Emit events to parent
    emit('created')
    emit('close')

    // Reset form fields
    employeeCode.value = ''
    firstName.value = ''
    lastName.value = ''
    email.value = ''
    departmentId.value = null
    rankId.value = null
    branchId.value = null
  } catch (err: any) {
    console.error('Employee creation error:', err)

    // Show user-friendly error
    const serverMessage = err.response?.data?.message
    const errors = err.response?.data?.errors

    if (errors) {
      // If Laravel returns validation errors (object of field -> messages)
      const errorMessages = Object.values(errors).flat().join('<br>')
      notification.error({
        message: 'Validation Error',
        description: errorMessages,
        duration: 6,
      })
    } else if (serverMessage) {
      notification.error({
        message: 'Creation Failed',
        description: serverMessage,
      })
    } else {
      notification.error({
        message: 'Error',
        description: 'Failed to create employee. Please try again.',
      })
    }
  }
}
</script>
