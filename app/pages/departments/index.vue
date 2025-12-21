<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <div class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-slate-800">Departments</h1>

      <a-button type="primary" @click="showCreate = true">
        Create Department
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
                <a-menu-item @click="openUpdate(record)">
                  Update
                </a-menu-item>

                <a-menu-item @click="toggleStatus(record)">
                  {{ record.status === 'active' ? 'Deactivate' : 'Activate' }}
                </a-menu-item>

                <a-menu-divider />

                <a-menu-item danger @click="confirmDelete(record)">
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
      @created="fetchDepartments"
    />

    <!-- Update -->
    <UpdateDepartment
      :open="showUpdate"
      :department="selectedDepartment"
      @close="showUpdate = false"
      @updated="fetchDepartments"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '~/utils/api'
import { message, Modal } from 'ant-design-vue'
import { EllipsisOutlined } from '@ant-design/icons-vue'

import CreateDepartment from '~/components/departments/CreateDepartment.vue'
import UpdateDepartment from '~/components/departments/UpdateDepartment.vue'

const departments = ref<any[]>([])
const error = ref('')
const showCreate = ref(false)
const showUpdate = ref(false)
const selectedDepartment = ref<any>(null)

const columns = [
  { title: '#', key: 'index', width: 60 },
  { title: 'Name', dataIndex: 'name' },
  { title: 'Description', dataIndex: 'description' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', width: 80 },
]

const fetchDepartments = async () => {
  try {
    const res = await api.get('/departments')
    departments.value = res.data
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load departments'
  }
}

const confirmDelete = (record: any) => {
  Modal.confirm({
    title: 'Delete Department',
    content: `Are you sure you want to delete "${record.name}"?`,
    okType: 'danger',
    onOk: async () => {
      await api.delete(`/departments/${record.id}`)
      message.success('Department deleted')
      fetchDepartments()
    },
  })
}

const toggleStatus = async (record: any) => {
  try {
    await api.patch(`/departments/${record.id}/status`)
    message.success('Status updated')
    fetchDepartments()
  } catch {
    message.error('Failed to update status')
  }
}

const openUpdate = (record: any) => {
  selectedDepartment.value = record
  showUpdate.value = true
}

onMounted(fetchDepartments)
</script>
