<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useNuxtApp } from '#app'
import { useAdminAttendanceService } from '@/services/admin-attendance.service'
import EmployeeAttendanceDrawer from '@/components/EmployeeAttendanceDrawer.vue'
import AttendanceFilters from '@/components/AttendanceFilters.vue'

const { $echo } = useNuxtApp() // Laravel Echo instance

const service = useAdminAttendanceService()
const rows = ref<any[]>([])
const loading = ref(true)
const selectedEmployee = ref<any>(null)
const drawerVisible = ref(false)

// Fetch today's attendance on mount
onMounted(async () => {
  try {
    const res = await service.today()
    rows.value = res.data.value
    loading.value = false

    // Listen for realtime attendance updates
    $echo
      .private('attendance.hr')           // HR/Admin channel
      .listen('.attendance.recorded', (e: any) => {
        // Prepend new attendance at the top
        rows.value.unshift(e.attendance)
      })
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error)
    loading.value = false
  }
})

// Open employee drawer
const openEmployee = (record: any) => {
  selectedEmployee.value = record.employee
  drawerVisible.value = true
}
</script>

<template>
  <a-card title="Today's Attendance">
    <!-- Optional filter component -->
    <AttendanceFilters />

    <!-- Attendance Table -->
    <a-table
      :data-source="rows"
      row-key="id"
      :loading="loading"
    >
      <a-table-column title="Employee">
        <template #default="{ record }">
          {{ record.employee?.first_name }} {{ record.employee?.last_name }}
        </template>
      </a-table-column>

      <a-table-column title="Status" dataIndex="status" />
      <a-table-column title="Worked (mins)" dataIndex="worked_minutes" />
      <a-table-column title="Late (mins)" dataIndex="late_minutes" />

      <a-table-column title="Action">
        <template #default="{ record }">
          <a-button type="link" @click="openEmployee(record)">
            View
          </a-button>
        </template>
      </a-table-column>
    </a-table>

    <!-- Employee drawer for detailed info -->
    <EmployeeAttendanceDrawer
      :employee="selectedEmployee"
      :open="drawerVisible"
      @close="drawerVisible = false"
    />
  </a-card>
</template>
