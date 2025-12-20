<template>
  <div class="p-6 bg-slate-100 min-h-screen">
    <h1 class="text-2xl font-bold mb-4 text-slate-800">Departments</h1>

    <!-- Create Department Form -->
    <a-form
      layout="inline"
      @finish="createDepartment"
      class="mb-6"
    >
      <div class="flex gap-2 mb-6">
        <a-input
          v-model:value="departmentName"
          placeholder="Enter department name"
          class="flex-1"
        />
        <a-button
          type="primary"
          :loading="loading"
          @click="createDepartment"
        >
          {{ loading ? 'Creating...' : 'Create' }}
        </a-button>
      </div>


    </a-form>

    <!-- Error Message -->
    <a-alert
      v-if="error"
      type="error"
      :message="error"
      show-icon
      closable
      class="mb-4"
    />

    <!-- Departments Table -->
   <div class="my-4">
     <a-table
      :columns="columns"
      :data-source="departments"
      :row-key="record => record.id"
      bordered
      class="bg-white shadow rounded"
    >
      <template #status="{ record }">
        <a-tag :color="record.active ? 'green' : 'red'">
          {{ record.active ? 'Active' : 'Inactive' }}
        </a-tag>
      </template>

      <template #actions="{ record }">
        <a-space>
          <a-button
            type="primary"
            size="small"
            @click="toggleStatus(record)"
          >
            {{ record.active ? 'Set Inactive' : 'Set Active' }}
          </a-button>
          <a-button
            type="default"
            danger
            size="small"
            @click="deleteDepartment(record)"
          >
            Delete
          </a-button>
        </a-space>
      </template>
    </a-table>
   </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '~/utils/api'
import { notification, message } from 'ant-design-vue'

const departmentName = ref('')
const departments = ref<any[]>([])
const error = ref('')
const loading = ref(false)

// Table columns without 'customRender' strings
const columns = [
  { title: 'Department Name', dataIndex: 'name', key: 'name' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions' },
]

// Fetch departments
const fetchDepartments = async () => {
  try {
    const res = await api.get('/departments')
    departments.value = res.data.map((d: any) => ({ ...d, active: true })) // default active
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to fetch departments'
  }
}
const createDepartment = async () => {
  console.log("Hello") // now this will show in console
  if (!departmentName.value.trim()) return
  loading.value = true
  try {
    const res = await api.post('/departments', { name: departmentName.value })
    notification.success({ message: 'Created', description: `${res.data.name} created successfully` })
    departmentName.value = ''
    await fetchDepartments()
  } catch (err: any) {
    notification.error({ message: 'Error', description: err.response?.data?.message || 'Failed to create' })
  } finally {
    loading.value = false
  }
}


// Delete department
const deleteDepartment = async (record: any) => {
  try {
    await api.delete(`/departments/${record.id}`)
    message.success(`${record.name} deleted successfully`)
    await fetchDepartments()
  } catch (err: any) {
    message.error(err.response?.data?.message || 'Failed to delete department')
  }
}

// Toggle active/inactive
const toggleStatus = async (record: any) => {
  try {
    record.active = !record.active
    message.success(`${record.name} is now ${record.active ? 'Active' : 'Inactive'}`)
  } catch {
    message.error('Failed to toggle status')
  }
}

onMounted(() => fetchDepartments())
</script>
