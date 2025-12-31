<script setup lang="ts">

import TodayAttendanceTable from '~/components/attendance/TodayAttendanceTable.vue'
import AttendanceStats from '~/components/attendance/AttendanceStats.vue'
import AttendanceChart from '~/components/attendance/AttendanceChart.vue'
import AttendanceFilters from '~/components/attendance/AttendanceFilters.vue'
import BiometricEnrollButton from '~/components/attendance/BiometricEnrollButton.vue'
import BiometricResetButton from '~/components/biometric/BiometricResetButton.vue'
import AttendanceExport from '~/components/attendance/AttendanceExport.vue'
import BiometricStatus from '~/components/biometric/BiometricStatus.vue'
import AttendanceHistory from '~/components/attendance/AttendanceHistory.vue'
import EmployeeAttendanceDrawer from '~/components/attendance/EmployeeAttendanceDrawer.vue'

const selectedEmployee = ref<any | null>(null)
const drawerVisible = ref(false)

const openEmployeeDrawer = (employee: any) => {
  selectedEmployee.value = employee
  drawerVisible.value = true
}

const closeDrawer = () => {
  drawerVisible.value = false
  selectedEmployee.value = null
}
</script>

<template>
  <div class="p-6 space-y-6">

    <!-- ===== STATS + CHART ===== -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <AttendanceStats />

      <div class="md:col-span-2">
        <AttendanceChart />
      </div>
    </div>

    <!-- ===== ACTION BAR ===== -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <AttendanceFilters />

      <div class="flex flex-wrap gap-2">
        <BiometricEnrollButton />
        <BiometricResetButton />
        <AttendanceExport />
      </div>
    </div>

    <!-- ===== BIOMETRIC STATUS ===== -->
    <BiometricStatus />

    <!-- ===== TODAY ATTENDANCE ===== -->
    <TodayAttendanceTable
      @open-employee="openEmployeeDrawer"
    />

    <!-- ===== HISTORY ===== -->
    <AttendanceHistory />

    <!-- ===== EMPLOYEE DRAWER ===== -->
    <EmployeeAttendanceDrawer
      :employee="selectedEmployee"
      :open="drawerVisible"
      @close="closeDrawer"
    />
  </div>
</template>
