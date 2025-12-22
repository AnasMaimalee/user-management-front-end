<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">Departments</h1>

      <a-button
        v-if="userStore.can('create departments')"
        type="primary"
        size="large"
        @click="showCreate = true"
      >
        <template #icon>
          <plus-outlined />
        </template>
        Create Department
      </a-button>
    </div>

    <!-- Error Alert -->
    <a-alert
      v-if="error"
      type="error"
      :message="error"
      show-icon
      closable
      class="mb-6"
    />

    <!-- Table -->
    <a-table
      :columns="columns"
      :data-source="departments"
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

        <!-- Name -->
        <template v-else-if="column.key === 'name'">
          <div class="flex items-center gap-3">
            <a-avatar
              :size="40"
              class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center"
            >
              {{ record.name?.charAt(0).toUpperCase() || 'D' }}
            </a-avatar>
            <div>
              <div class="font-semibold text-slate-800">{{ record.name }}</div>
              <div class="text-xs text-slate-500">ID: {{ record.id.slice(0, 8) }}...</div>
            </div>
          </div>
        </template>

        <!-- Description -->
        <template v-else-if="column.key === 'description'">
          <div class="max-w-xs">
            <p class="text-slate-700 text-sm line-clamp-2">
              {{ record.description || '—' }}
            </p>
          </div>
        </template>

        <!-- Status -->
        <template v-else-if="column.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'volcano'">
            <template #icon>
              <span
                class="w-2 h-2 rounded-full inline-block mr-1.5"
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
                  v-if="userStore.can('update departments')"
                  @click="openUpdate(record)"
                  class="flex items-center"
                >
                  <edit-outlined class="mr-2 text-blue-600" /> Update
                </a-menu-item>

                <a-menu-item
                  v-if="userStore.can('update department status')"
                  @click="toggleStatus(record)"
                  class="flex items-center"
                >
                  <sync-outlined class="mr-2 text-yellow-600" />
                  {{ record.status === 'active' ? 'Deactivate' : 'Activate' }}
                </a-menu-item>

                <a-menu-divider />

                <a-menu-item
                  danger
                  v-if="userStore.can('delete departments')"
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
    <CreateDepartment
      :open="showCreate"
      @close="showCreate = false"
      @created="fetchDepartments"
    />

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
import {
  EllipsisOutlined,
  PlusOutlined,
  EditOutlined,
  SyncOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'

import { useUserStore } from '~/stores/user'
import CreateDepartment from '~/components/departments/CreateDepartment.vue'
import UpdateDepartment from '~/components/departments/UpdateDepartment.vue'

const userStore = useUserStore()
await userStore.fetchUser()

const departments = ref<any[]>([])
const error = ref<string | null>(null)
const loading = ref(false)
const showCreate = ref(false)
const showUpdate = ref(false)
const selectedDepartment = ref<any>(null)

const columns = [
  { title: '#', key: 'index', width: 70, fixed: 'left' },
  { title: 'Department', key: 'name', width: 320 },
  { title: 'Description', key: 'description', width: 400 },
  { title: 'Status', key: 'status', width: 130 },
  { title: 'Actions', key: 'actions', width: 100, fixed: 'right' },
]

const fetchDepartments = async () => {
  loading.value = true
  try {
    const res = await api.get('/departments')
    departments.value = res.data
    error.value = null
  } catch (err: any) {
    console.error('Fetch departments error:', err)
    if (err.response?.status === 403) {
      error.value = 'You do not have permission to view departments'
    } else {
      error.value = err.response?.data?.message || 'Failed to load departments'
    }
  } finally {
    loading.value = false
  }
}

const confirmDelete = (record: any) => {
  Modal.confirm({
    title: 'Delete Department',
    content: `Are you sure you want to delete <strong>${record.name}</strong>? This may affect employees assigned to this department.`,
    okType: 'danger',
    okText: 'Delete',
    onOk: async () => {
      try {
        await api.delete(`/departments/${record.id}`)
        message.success('Department deleted successfully')
        fetchDepartments()
      } catch {
        message.error('Failed to delete department')
      }
    },
  })
}

const toggleStatus = async (record: any) => {
  try {
    await api.patch(`/departments/${record.id}/status`)
    message.success(`Department ${record.status === 'active' ? 'deactivated' : 'activated'}`)
    fetchDepartments()
  } catch {
    message.error('Failed to update status')
  }
}

const openUpdate = (record: any) => {
  selectedDepartment.value = { ...record }
  showUpdate.value = true
}

onMounted(() => {
  fetchDepartments()
})
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

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style>