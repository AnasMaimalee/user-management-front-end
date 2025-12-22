<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">Branches</h1>

      <a-button
        v-if="userStore.can('create branches')"
        type="primary"
        size="large"
        @click="showCreate = true"
      >
        <template #icon>
          <plus-outlined />
        </template>
        Create Branch
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
      :data-source="branches"
      row-key="id"
      bordered
      :loading="loading"
      class="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <template #emptyText>
        <div class="py-12 text-center">
          <p class="text-slate-500 mb-4">No branches found</p>
          <a-button type="primary" @click="showCreate = true">
            Create Your First Branch
          </a-button>
        </div>
      </template>

      <template #bodyCell="{ column, record, index }">
        <!-- Index -->
        <template v-if="column?.key === 'index'">
          <span class="text-slate-600 font-semibold">{{ index + 1 }}</span>
        </template>

        <!-- Branch Name + Location -->
        <template v-else-if="column?.key === 'name'">
          <div class="flex items-center gap-3">
            <a-avatar
              :size="40"
              class="bg-gradient-to-br from-orange-500 to-red-600 text-white font-bold flex items-center justify-center"
            >
              {{ record.name?.charAt(0).toUpperCase() || 'B' }}
            </a-avatar>
            <div>
              <div class="font-semibold text-slate-800">
                {{ record.name || 'Unnamed Branch' }}
              </div>
              <div class="text-xs text-slate-500">
                {{ record.state }}, {{ record.country }}
              </div>
            </div>
          </div>
        </template>

        <!-- Status -->
        <template v-else-if="column?.key === 'status'">
          <a-tag :color="record.status === 'active' ? 'green' : 'volcano'">
            <template #icon>
              <span
                class="w-2 h-2 rounded-full inline-block mr-1.5"
                :class="record.status === 'active' ? 'bg-green-500' : 'bg-red-500'"
              ></span>
            </template>
            {{ (record.status || 'inactive').toUpperCase() }}
          </a-tag>
        </template>

        <!-- Actions -->
        <template v-else-if="column?.key === 'actions'">
          <a-dropdown trigger="click">
            <a-button type="text" size="small">
              <ellipsis-outlined class="text-lg text-slate-600 hover:text-slate-900 transition" />
            </a-button>
            <template #overlay>
              <a-menu class="shadow-lg">
                <a-menu-item
                  v-if="userStore.can('update branches')"
                  @click="openUpdate(record)"
                >
                  <edit-outlined class="mr-2 text-blue-600" /> Update
                </a-menu-item>

                <a-menu-item
                  v-if="userStore.can('update branch status')"
                  @click="toggleStatus(record)"
                >
                  <sync-outlined class="mr-2 text-yellow-600" />
                  {{ record.status === 'active' ? 'Deactivate' : 'Activate' }}
                </a-menu-item>

                <a-menu-divider />

                <a-menu-item
                  danger
                  v-if="userStore.can('delete branches')"
                  @click="confirmDelete(record)"
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
    <CreateBranch
      :open="showCreate"
      @close="showCreate = false"
      @created="fetchBranches"
    />

    <UpdateBranch
      :open="showUpdate"
      :branch="selectedBranch"
      @close="showUpdate = false"
      @updated="fetchBranches"
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
import CreateBranch from '~/components/branches/CreateBranch.vue'
import UpdateBranch from '~/components/branches/UpdateBranch.vue'

const userStore = useUserStore()

const branches = ref<any[]>([])
const error = ref<string | null>(null)
const loading = ref(false)
const showCreate = ref(false)
const showUpdate = ref(false)
const selectedBranch = ref<any>(null)

const columns = [
  { title: '#', key: 'index', width: 70, fixed: 'left' },
  { title: 'Branch', key: 'name', width: 420 },
  { title: 'Status', key: 'status', width: 140 },
  { title: 'Actions', key: 'actions', width: 100, fixed: 'right' },
]

const fetchBranches = async () => {
  loading.value = true
  try {
    const res = await api.get('/branches')
    
    branches.value = Array.isArray(res.data) 
      ? (Array.isArray(res.data[0]) ? res.data[0] : res.data)
      : []

    // Normalize status
    branches.value = branches.value.map((branch: any) => ({
      ...branch,
      status: branch.status ?? 'inactive'
    }))

    error.value = null
  } catch (err: any) {
    console.error('Fetch branches error:', err)
    branches.value = []
    if (err.response?.status === 403) {
      error.value = 'You do not have permission to view branches'
    } else {
      error.value = err.response?.data?.message || 'Failed to load branches'
    }
  } finally {
    loading.value = false
  }
}

const confirmDelete = (record: any) => {
  Modal.confirm({
    title: 'Delete Branch',
    content: `Are you sure you want to delete <strong>${record.name}</strong>? This may affect assigned employees.`,
    okType: 'danger',
    onOk: async () => {
      try {
        await api.delete(`/branches/${record.id}`)
        message.success('Branch deleted successfully')
        fetchBranches()
      } catch {
        message.error('Failed to delete branch')
      }
    },
  })
}

const toggleStatus = async (record: any) => {
  const branch = branches.value.find(b => b.id === record.id)
  if (!branch) return

  const oldStatus = branch.status
  branch.status = oldStatus === 'active' ? 'inactive' : 'active'

  try {
    await api.patch(`/branches/${record.id}/status`)
    message.success(`Branch ${branch.status === 'active' ? 'activated' : 'deactivated'}`)
  } catch {
    branch.status = oldStatus
    message.error('Failed to update status')
    fetchBranches()
  }
}

const openUpdate = (record: any) => {
  selectedBranch.value = { ...record }
  showUpdate.value = true
}

onMounted(async () => {
  // Ensure user permissions are loaded
  if (!userStore.user) {
    await userStore.fetchUser()
  }
  fetchBranches()
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
</style>