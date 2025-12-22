<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold text-slate-800">Ranks</h1>

      <a-button
        v-if="userStore.can('create ranks')"
        type="primary"
        size="large"
        @click="showCreate = true"
      >
        <template #icon>
          <plus-outlined />
        </template>
        Create Rank
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
      :data-source="ranks"
      row-key="id"
      bordered
      :loading="loading"
      class="bg-white rounded-lg shadow-sm overflow-hidden"
    >
      <template #emptyText>
        <div class="py-12 text-center">
          <p class="text-slate-500 mb-4">No ranks found</p>
          <a-button type="primary" @click="showCreate = true">
            Create Your First Rank
          </a-button>
        </div>
      </template>

      <template #bodyCell="{ column, record, index }">
        <!-- Index -->
        <template v-if="column?.key === 'index'">
          <span class="text-slate-600 font-semibold">{{ index + 1 }}</span>
        </template>

        <!-- Rank Name + Priority -->
        <template v-else-if="column?.key === 'name'">
          <div class="flex items-center gap-3">
            <a-avatar
              :size="40"
              class="bg-gradient-to-br from-purple-500 to-pink-600 text-white font-bold flex items-center justify-center"
            >
              {{ record.name?.charAt(0).toUpperCase() || 'R' }}
            </a-avatar>
            <div>
              <div class="font-semibold text-slate-800">
                {{ record.name || 'Unnamed Rank' }}
              </div>
              <div class="text-xs text-slate-500">
                Priority: <span class="font-medium">{{ record.priority || '—' }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- Status - Now Fully Enabled -->
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

        <!-- Actions - Status Toggle Enabled -->
        <template v-else-if="column?.key === 'actions'">
          <a-dropdown trigger="click">
            <a-button type="text" size="small">
              <ellipsis-outlined class="text-lg text-slate-600 hover:text-slate-900 transition" />
            </a-button>
            <template #overlay>
              <a-menu class="shadow-lg">
                <a-menu-item
                  v-if="userStore.can('update ranks')"
                  @click="openUpdate(record)"
                >
                  <edit-outlined class="mr-2 text-blue-600" /> Update
                </a-menu-item>

                <a-menu-item
                  v-if="userStore.can('update rank status')"
                  @click="toggleStatus(record)"
                >
                  <sync-outlined class="mr-2 text-yellow-600" />
                  {{ record.status === 'active' ? 'Deactivate' : 'Activate' }}
                </a-menu-item>

                <a-menu-divider />

                <a-menu-item
                  danger
                  v-if="userStore.can('delete ranks')"
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
    <CreateRank
      :open="showCreate"
      @close="showCreate = false"
      @created="fetchRanks"
    />

    <UpdateRank
      :open="showUpdate"
      :rank="selectedRank"
      @close="showUpdate = false"
      @updated="fetchRanks"
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
import CreateRank from '~/components/ranks/CreateRank.vue'
import UpdateRank from '~/components/ranks/UpdateRank.vue'

const userStore = useUserStore()
await userStore.fetchUser()

const ranks = ref<any[]>([])
const error = ref<string | null>(null)
const loading = ref(false)
const showCreate = ref(false)
const showUpdate = ref(false)
const selectedRank = ref<any>(null)

const columns = [
  { title: '#', key: 'index', width: 70, fixed: 'left' },
  { title: 'Rank', key: 'name', width: 400 },
  { title: 'Status', key: 'status', width: 140 },
  { title: 'Actions', key: 'actions', width: 100, fixed: 'right' },
]

const fetchRanks = async () => {
  loading.value = true
  try {
    const res = await api.get('/ranks')
    
    // Flatten if wrapped in extra array
    ranks.value = Array.isArray(res.data) 
      ? (Array.isArray(res.data[0]) ? res.data[0] : res.data)
      : []

    // Add default status if missing (for old records)
    ranks.value = ranks.value.map((rank: any) => ({
      ...rank,
      status: rank.status ?? 'inactive'
    }))

    error.value = null
  } catch (err: any) {
    console.error('Fetch ranks error:', err)
    ranks.value = []
    if (err.response?.status === 403) {
      error.value = 'You do not have permission to view ranks'
    } else {
      error.value = err.response?.data?.message || 'Failed to load ranks'
    }
  } finally {
    loading.value = false
  }
}

const confirmDelete = (record: any) => {
  Modal.confirm({
    title: 'Delete Rank',
    content: `Are you sure you want to delete <strong>${record.name}</strong>?`,
    okType: 'danger',
    onOk: async () => {
      try {
        await api.delete(`/ranks/${record.id}`)
        message.success('Rank deleted successfully')
        fetchRanks()
      } catch {
        message.error('Failed to delete rank')
      }
    },
  })
}

const toggleStatus = async (record: any) => {
  const rank = ranks.value.find(r => r.id === record.id)
  if (!rank) return

  const oldStatus = rank.status
  rank.status = oldStatus === 'active' ? 'inactive' : 'active'

  try {
    await api.patch(`/ranks/${record.id}/status`)
    message.success(`Rank ${rank.status === 'active' ? 'activated' : 'deactivated'}`)
  } catch {
    rank.status = oldStatus
    message.error('Failed to update status')
    fetchRanks()
  }
}

const openUpdate = (record: any) => {
  selectedRank.value = { ...record }
  showUpdate.value = true
}

onMounted(() => {
  fetchRanks()
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