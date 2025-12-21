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

// Placeholder fetch functions for ranks and branches
const fetchRanks = async () => {
  loadingRanks.value = true
  try {
    const res = await api.get('/ranks') // update endpoint later
    ranks.value = res.data || []
  } catch (err: any) {
    ranks.value = []
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
  if (!employeeCode.value.trim() || !firstName.value.trim() || !lastName.value.trim() || !email.value.trim()) {
    notification.error({ message: 'All fields except department, rank, and branch are required' })
    return
  }

  try {
    await api.post('/employees', {
      employee_code: employeeCode.value,
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
      department_id: departmentId.value,
      rank_id: rankId.value,
      branch_id: branchId.value,
    })

    notification.success({ message: 'Employee created' })
    emit('created')
    emit('close')

    // Reset form
    employeeCode.value = ''
    firstName.value = ''
    lastName.value = ''
    email.value = ''
    departmentId.value = null
    rankId.value = null
    branchId.value = null
  } catch (err: any) {
    notification.error({
      message: 'Error',
      description: err.response?.data?.message || 'Failed to create employee',
    })
  }
}
</script>
