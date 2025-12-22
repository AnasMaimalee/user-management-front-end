<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">Employees</h1>

      <a-button
        v-if="userStore.can('create employees')"
        type="primary"
        size="large"
        @click="showCreate = true"
      >
        <template #icon>
          <plus-outlined />
        </template>
        Create Employee
      </a-button>
    </div>

    <a-alert
      v-if="error"
      type="error"
      :message="error"
      show-icon
      closable
      class="mb-6"
    />

    <a-table
      :columns="columns"
      :data-source="employees"
      row-key="id"
      bordered
      :loading="loading"
      class="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <template #bodyCell="{ column, record, index }">
        <!-- Index -->
        <template v-if="column.key === 'index'">
          <span class="text-slate-600 font-semibold">{{ index + 1 }}</span>
        </template>

        <!-- Employee Code -->
        <template v-else-if="column.key === 'employee_code'">
          <a-tag color="geekblue" class="font-mono text-xs font-bold">
            {{ record.employee_code || 'N/A' }}
          </a-tag>
        </template>

        <!-- Full Name -->
        <template v-else-if="column.key === 'name'">
          <div class="flex items-center gap-3">
            <a-avatar
              :size="36"
              class="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold"
            >
              {{ getInitials(record) }}
            </a-avatar>
            <div>
              <div class="font-medium text-slate-800">
                {{ record.first_name }} {{ record.last_name }}
              </div>
              <div class="text-xs text-slate-500">ID: {{ record.id.slice(0, 8) }}...</div>
            </div>
          </div>
        </template>

        <!-- Email -->
        <template v-else-if="column.key === 'email'">
          <a :href="`mailto:${record.email}`" class="text-blue-600 hover:text-blue-800 text-sm">
            {{ record.email || '—' }}
          </a>
        </template>

        <!-- Department -->
        <template v-else-if="column.key === 'department'">
          <a-tag color="cyan" v-if="record.department">
            {{ record.department.name }}
          </a-tag>
          <span v-else class="text-slate-400 text-sm">Not Assigned</span>
        </template>

        <!-- Rank -->
        <template v-else-if="column.key === 'rank'">
          <a-tag color="purple" v-if="record.rank">
            {{ record.rank.name }}
          </a-tag>
          <span v-else class="text-slate-400 text-sm">Not Assigned</span>
        </template>

        <!-- Branch -->
        <template v-else-if="column.key === 'branch'">
          <a-tag color="orange" v-if="record.branch">
            {{ record.branch.name }}
          </a-tag>
          <span v-else class="text-slate-400 text-sm">Not Assigned</span>
        </template>

        <!-- Status -->
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'volcano'">
            <template #icon>
              <span class="w-2 h-2 rounded-full inline-block mr-1"
                :class="record.status === 'active' ? 'bg-green-500' : 'bg-red-500'"
              ></span>
            </template>
            {{ (record.status || 'unknown').toUpperCase() }}
          </a-tag>
        </template>

        <!-- Actions -->
        <template v-else-if="column.key === 'actions'">
          <a-dropdown trigger="click">
            <a-button type="text" size="small">
              <ellipsis-outlined class="text-lg text-slate-600 hover:text-slate-900 transition" />
            </a-button>
            <template #overlay>
              <a-menu class="shadow-lg">
                <a-menu-item
                  v-if="userStore.can('update employees')"
                  @click="openUpdate(record)"
                  class="flex items-center"
                >
                  <edit-outlined class="mr-2 text-blue-600" /> Update
                </a-menu-item>

                <a-menu-item
                  v-if="userStore.can('update employee status')"
                  @click="toggleStatus(record)"
                  class="flex items-center"
                >
                  <sync-outlined class="mr-2 text-yellow-600" />
                  {{ record.status === 'active' ? 'Deactivate' : 'Activate' }}
                </a-menu-item>

                <a-menu-divider />

                <a-menu-item
                  danger
                  v-if="userStore.can('delete employees')"
                  @click="confirmDelete(record)"
                  class="flex items-center"
                >
                  <delete-outlined class="mr-2" /> Delete
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </template>
    </a-table>

    <!-- Modals -->
    <CreateEmployee
      :open="showCreate"
      @close="showCreate = false"
      @created="fetchEmployees"
    />

    <UpdateEmployee
      :open="showUpdate"
      :employee="selectedEmployee"
      @close="showUpdate = false"
      @updated="fetchEmployees"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '~/utils/api'
import { message, Modal } from 'ant-design-vue'
import {
  EllipsisOutlined,
  PlusOutlined,
  EditOutlined,
  SyncOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'

import { useUserStore } from '~/stores/user'
import CreateEmployee from '~/components/employees/CreateEmployee.vue'
import UpdateEmployee from '~/components/employees/UpdateEmployee.vue'

const userStore = useUserStore()
await userStore.fetchUser()

const employees = ref<any[]>([])
const error = ref<string | null>(null)
const loading = ref(false)
const showCreate = ref(false)
const showUpdate = ref(false)
const selectedEmployee = ref<any>(null)

// Helper: Get initials for avatar
const getInitials = (record: any) => {
  const first = record.first_name?.[0] || ''
  const last = record.last_name?.[0] || ''
  return (first + last).toUpperCase() || 'NA'
}

const columns = [
  { title: '#', key: 'index', width: 70, fixed: 'left' },
  { title: 'Employee', key: 'name', width: 280 },
  { title: 'Code', key: 'employee_code', width: 120 },
  { title: 'Email', key: 'email', width: 220 },
  { title: 'Department', key: 'department', width: 160 },
  { title: 'Rank', key: 'rank', width: 140 },
  { title: 'Branch', key: 'branch', width: 140 },
  { title: 'Status', key: 'status', width: 120 },
  { title: 'Actions', key: 'actions', width: 100, fixed: 'right' },
]

const fetchEmployees = async () => {
  loading.value = true
  try {
    const res = await api.get('/employees')
    employees.value = res.data
    error.value = null
  } catch (err: any) {
    console.error('Fetch employees error:', err)
    if (err.response?.status === 403) {
      error.value = 'You do not have permission to view employees'
    } else {
      error.value = err.response?.data?.message || 'Failed to load employees'
    }
  } finally {
    loading.value = false
  }
}

const confirmDelete = (record: any) => {
  Modal.confirm({
    title: 'Delete Employee',
    content: `<strong>${record.first_name} ${record.last_name}</strong> will be permanently deleted.`,
    okType: 'danger',
    okText: 'Delete',
    onOk: async () => {
      try {
        await api.delete(`/employees/${record.id}`)
        message.success('Employee deleted')
        fetchEmployees()
      } catch {
        message.error('Failed to delete')
      }
    },
  })
}

const toggleStatus = async (record: any) => {
  try {
    await api.patch(`/employees/${record.id}/status`)
    message.success(`Employee ${record.status === 'active' ? 'deactivated' : 'activated'}`)
    fetchEmployees()
  } catch {
    message.error('Failed to update status')
  }
}

const openUpdate = (record: any) => {
  selectedEmployee.value = { ...record }
  showUpdate.value = true
}

onMounted(fetchEmployees)
</script>

<style scoped>
:deep(.ant-table-thead > tr > th) {
  background-color: #f1f5f9 !important;
  font-weight: 600;
  color: #334155;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background-color: #f8fafc !important;
}
</style>