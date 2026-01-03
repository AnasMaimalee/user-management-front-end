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

    <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
      <div class="p-6 border-b border-slate-200 bg-slate-50">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-semibold text-slate-800">Employee List</h2>

         
        </div>

        <!-- Refresh + Export Buttons -->
        <div class="flex justify-end gap-3">
          <a-button type="default" @click="fetchEmployees" :loading="loading">
            <ReloadOutlined class="mr-2" />
            Refresh
          </a-button>
          <a-button
            type="primary"
            danger
            @click="exportPdf"
            :loading="exportingPdf"
            :disabled="filteredEmployees.length === 0"
          >
            Export PDF
          </a-button>
          <a-button
            type="primary"
            @click="exportExcel"
            :loading="exportingExcel"
            :disabled="filteredEmployees.length === 0"
          >
            Export Excel
          </a-button>
           <!-- Filter Dropdown -->
          <a-dropdown :trigger="['click']" v-model:open="filterOpen">
            <a-button type="primary">
              <FilterOutlined class="mr-2" />
              Filters
              <DownOutlined class="ml-2" />
            </a-button>
            <template #overlay>
              <div class="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 w-96">
                <h3 class="text-lg font-semibold text-slate-800 mb-5">Filter Employees</h3>
                <div class="space-y-5">
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Department</label>
                    <a-select
                      v-model:value="filters.department"
                      placeholder="All departments"
                      :options="departmentOptions"
                      allow-clear
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Rank</label>
                    <a-select
                      v-model:value="filters.rank"
                      placeholder="All ranks"
                      :options="rankOptions"
                      allow-clear
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                    <a-select
                      v-model:value="filters.branch"
                      placeholder="All branches"
                      :options="branchOptions"
                      allow-clear
                      class="w-full"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <a-select
                      v-model:value="filters.status"
                      placeholder="All statuses"
                      allow-clear
                      class="w-full"
                    >
                      <a-select-option value="active">Active</a-select-option>
                      <a-select-option value="inactive">Inactive</a-select-option>
                    </a-select>
                  </div>
                </div>
                <div class="mt-6 flex justify-end">
                  <a-button @click="resetFilters">Reset Filters</a-button>
                </div>
              </div>
            </template>
          </a-dropdown>
        </div>
      </div>

      <a-table
        :columns="columns"
        :data-source="filteredEmployees"
        row-key="id"
        bordered
        :loading="loading"
      >
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'index'">{{ index + 1 }}</template>
          <template v-else-if="column.key === 'employee_code'">
            <a-tag color="geekblue">{{ record.employee_code || '—' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'name'">
            <div class="flex items-center gap-3">
              <a-avatar
                :size="40"
                class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold"
              >
                {{ getInitials(record) }}
              </a-avatar>
              <div>
                <div class="font-medium text-slate-800">{{ fullName(record) }}</div>
                <div class="text-xs text-slate-500">{{ record.id.slice(0, 8) }}...</div>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'email'">
            <a :href="`mailto:${record.email}`" class="text-blue-600 hover:underline">{{ record.email || '—' }}</a>
          </template>
          <template v-else-if="column.key === 'department'">
            <a-tag color="cyan">{{ record.department?.name || '—' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'rank'">
            <a-tag color="purple">{{ record.rank?.name || '—' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'branch'">
            <a-tag color="orange">{{ record.branch?.name || '—' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'active' ? 'green' : 'volcano'">
              {{ record.status.toUpperCase() }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-dropdown trigger="click">
              <a-button type="text" size="small">
                <EllipsisOutlined class="text-lg" />
              </a-button>
              <template #overlay>
                <a-menu>
                  <a-menu-item @click="openUpdate(record)">
                    <EditOutlined class="mr-2 text-blue-600" /> Update
                  </a-menu-item>
                  <a-menu-item @click="toggleStatus(record)">
                    <SyncOutlined class="mr-2 text-yellow-600" />
                    {{ record.status === 'active' ? 'Deactivate' : 'Activate' }}
                  </a-menu-item>
                  <a-menu-item danger @click="confirmDelete(record)">
                    <DeleteOutlined class="mr-2" /> Delete
                  </a-menu-item>
                </a-menu>
              </template>
            </a-dropdown>
          </template>
        </template>

        <template #emptyText>
          <div class="py-16 text-center">
            <div class="text-8xl text-slate-100 mb-4">👥</div>
            <p class="text-2xl font-medium text-slate-700">No employees found</p>
            <p class="text-slate-500">Create your first employee to get started</p>
          </div>
        </template>
      </a-table>
    </div>

    <!-- Modals -->
    <CreateEmployee v-model:open="showCreate" @created="fetchEmployees" />
    <UpdateEmployee v-model:open="showUpdate" :employee="selectedEmployee" @updated="fetchEmployees" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import dayjs from 'dayjs'
import api from '~/utils/api'
import { notification, Modal } from 'ant-design-vue'
import { useUserStore } from '~/stores/user'
import {
  EllipsisOutlined,
  PlusOutlined,
  EditOutlined,
  SyncOutlined,
  DeleteOutlined,
  FilterOutlined,
  ReloadOutlined,
  DownOutlined,
} from '@ant-design/icons-vue'

import CreateEmployee from '~/components/employees/CreateEmployee.vue'
import UpdateEmployee from '~/components/employees/UpdateEmployee.vue'

const userStore = useUserStore()
await userStore.fetchUser()

const employees = ref<any[]>([])
const filteredEmployees = computed(() => {
  return employees.value.filter(e => {
    if (filters.department && e.department?.id !== filters.department) return false
    if (filters.rank && e.rank?.id !== filters.rank) return false
    if (filters.branch && e.branch?.id !== filters.branch) return false
    if (filters.status && e.status !== filters.status) return false
    return true
  })
})

const error = ref<string | null>(null)
const loading = ref(false)
const exportingPdf = ref(false)
const exportingExcel = ref(false)
const showCreate = ref(false)
const showUpdate = ref(false)
const selectedEmployee = ref<any>(null)

const filterOpen = ref(false)

const filters = reactive({
  department: null,
  rank: null,
  branch: null,
  status: null,
})

const departmentOptions = ref<any[]>([])
const rankOptions = ref<any[]>([])
const branchOptions = ref<any[]>([])

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

const columns = [
  { title: '#', key: 'index', width: 60 },
  { title: 'Name', key: 'name', width: 280 },
  { title: 'Code', key: 'employee_code', width: 120 },
  { title: 'Email', key: 'email', width: 220 },
  { title: 'Department', key: 'department', width: 160 },
  { title: 'Rank', key: 'rank', width: 140 },
  { title: 'Branch', key: 'branch', width: 140 },
  { title: 'Status', key: 'status', width: 120 },
  { title: 'Actions', key: 'actions', width: 100 },
]

const fullName = (e: any) => e ? `${e.first_name || ''} ${e.last_name || ''}`.trim() : 'Unknown'
const getInitials = (e: any) => e ? `${e.first_name?.[0] || ''}${e.last_name?.[0] || ''}`.toUpperCase() : 'NA'

const fetchEmployees = async () => {
  loading.value = true
  try {
    const res = await api.get('/employees')
    employees.value = res.data || []
    error.value = null
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load employees'
    notification.error({ message: error.value })
  } finally {
    loading.value = false
  }
}

const fetchFilterOptions = async () => {
  try {
    const [deptRes, rankRes, branchRes] = await Promise.all([
      api.get('/departments'),
      api.get('/ranks'),
      api.get('/branches')
    ])

    departmentOptions.value = (deptRes.data || []).map(d => ({ value: d.id, label: d.name }))
    rankOptions.value = (rankRes.data || []).map(r => ({ value: r.id, label: r.name }))
    branchOptions.value = (branchRes.data || []).map(b => ({ value: b.id, label: b.name }))
  } catch (err: any) {
    notification.error({ message: 'Failed to load filter options' })
  }
}

const resetFilters = () => {
  filters.department = null
  filters.rank = null
  filters.branch = null
  filters.status = null
  filterOpen.value = false
}

const exportFile = async (format: 'pdf' | 'excel') => {
  const loadingRef = format === 'pdf' ? exportingPdf : exportingExcel
  loadingRef.value = true
  try {
    const params = {}
    if (filters.department) params.department = filters.department
    if (filters.rank) params.rank = filters.rank
    if (filters.branch) params.branch = filters.branch
    if (filters.status) params.status = filters.status

    const res = await api.get(`/employees/export-${format}`, { params, responseType: 'blob' })

    const blob = new Blob([res.data], {
      type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `employees_${dayjs().format('YYYY-MM-DD')}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    link.click()
    URL.revokeObjectURL(link.href)

    notification.success({ message: `${format.toUpperCase()} exported successfully` })
  } catch (err) {
    notification.error({ message: 'Export failed' })
  } finally {
    loadingRef.value = false
  }
}

const exportPdf = () => exportFile('pdf')
const exportExcel = () => exportFile('excel')

const toggleStatus = async (record: any) => {
  const newStatus = record.status === 'active' ? 'inactive' : 'active'
  try {
    await api.patch(`/employees/${record.id}/status`, { status: newStatus })
    notification.success({ message: `Employee ${newStatus === 'active' ? 'activated' : 'deactivated'}` })
    fetchEmployees()
  } catch (err) {
    notification.error({ message: 'Failed to update status' })
  }
}

const confirmDelete = (record: any) => {
  Modal.confirm({
    title: 'Delete Employee',
    content: `Are you sure you want to delete ${fullName(record)}?`,
    okText: 'Delete',
    okType: 'danger',
    onOk: async () => {
      try {
        await api.delete(`/employees/${record.id}`)
        notification.success({ message: 'Employee deleted' })
        fetchEmployees()
      } catch (err) {
        notification.error({ message: 'Failed to delete employee' })
      }
    }
  })
}

const openUpdate = (record: any) => {
  selectedEmployee.value = { ...record }
  showUpdate.value = true
}

onMounted(() => {
  fetchFilterOptions()
  fetchEmployees()
})
</script>