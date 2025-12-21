<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-slate-800">Employee</h1>

      <a-button 
        v-if="userStore.can('create departments')"
        type="primary" 
        @click="showCreate = true">
        Create Employee
      </a-button>
    </div>

    <a-alert
      v-if="error"
      type="error"
      :message="error"
      show-icon
      closable
      class="mb-4"
    />

    <a-table
      :columns="columns"
      :data-source="departments"
      row-key="id"
      bordered
      class="bg-white rounded shadow"
    >
      <template #bodyCell="{ column, record, index }">
        <!-- Index -->
        <template v-if="column.key === 'index'">
          {{ index + 1 }}
        </template>

        <!-- Status -->
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'red'">
            {{ record.status }}
          </a-tag>
        </template>

        <!-- Actions -->
        <template v-else-if="column.key === 'actions'">
          <a-dropdown trigger="click">
            <a-button type="text">
              <EllipsisOutlined class="text-lg" />
            </a-button>

            <template #overlay>
              <a-menu>
                
                <a-menu-item 
                v-if="userStore.can('update employees')"
                @click="openUpdate(record)">
                  Update
                </a-menu-item>


                <a-menu-item 
                v-if="userStore.can('update employee status')"
                @click="toggleStatus(record)">
                  {{ record.status === 'active' ? 'Deactivate' : 'Activate' }}
                </a-menu-item>

                <a-menu-divider />

                <a-menu-item danger
                v-if="userStore.can('delete employees')"
                @click="confirmDelete(record)">
                  Delete
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </template>
      </template>
    </a-table>

    <!-- Create -->
    <CreateDepartment
      :open="showCreate"
      @close="showCreate = false"
      @created="fetchEmployees"
    />

    <!-- Update -->
    <UpdateDepartment
      :open="showUpdate"
      :department="selectedDepartment"
      @close="showUpdate = false"
      @updated="fetchEmployees"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '~/utils/api'
import { message, Modal } from 'ant-design-vue'
import { EllipsisOutlined } from '@ant-design/icons-vue'

import { useUserStore } from '~/stores/user'
const userStore = useUserStore()
await userStore.fetchUser()

import CreateDepartment from '~/components/employees/CreateEmployee.vue'
import UpdateDepartment from '~/components/departments/UpdateDepartment.vue'

const departments = ref<any[]>([])
const error = ref('')
const showCreate = ref(false)
const showUpdate = ref(false)
const selectedDepartment = ref<any>(null)

const columns = [
  { title: '#', key: 'index', width: 60 },
  { title: 'Employee Code', dataIndex: 'employee_code' },
  { title: 'First Name', dataIndex: 'first_name' },
  { title: 'Last Name', dataIndex: 'last_name' },
  { title: 'Branch', dataIndex: 'branch' },
  { title: 'Department', dataIndex: 'department' },
  { title: 'Rank', dataIndex: 'rank' },

  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', width: 80 },
]

const fetchEmployees = async () => {
  try {
    const res = await api.get('/employees')
    departments.value = res.data
    console.log(departments, "Dep")
  } catch (err: any) {
    console.error(err) // check actual error
    if (err.response?.status === 403) {
      error.value = 'You do not have permission to view employees'
    } else {
      error.value = err.response?.data?.message || 'Failed to load employees'
    }
  }
}


const confirmDelete = (record: any) => {
  Modal.confirm({
    title: 'Delete Employee',
    content: `Are you sure you want to delete "${record.name}"?`,
    okType: 'danger',
    onOk: async () => {
      await api.delete(`/employees/${record.id}`)
      message.success('Department deleted')
      fetchEmployees()
    },
  })
}

const toggleStatus = async (record: any) => {
  try {
    await api.patch(`/employees/${record.id}/status`)
    message.success('Status updated')
    fetchEmployees()
  } catch {
    message.error('Failed to update status')
  }
}

const openUpdate = (record: any) => {
  selectedDepartment.value = record
  showUpdate.value = true
}

onMounted(fetchEmployees)
</script>
