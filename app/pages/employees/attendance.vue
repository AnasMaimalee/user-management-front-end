<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50">
    <div class="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">

      <!-- Header -->
      <div class="mb-12 text-center">
        <h1 class="text-4xl font-extrabold text-slate-800 mb-2">
          My Attendance Dashboard
        </h1>
        <p class="text-slate-600 text-lg">
          Overview of your presence, consistency, and performance
        </p>
      </div>

      <a-spin :spinning="loading" tip="Loading your attendance..." size="large">

        <!-- ===================== STATS ===================== -->
        <a-row :gutter="[24, 24]" class="mb-12">
          <a-col :span="24" :md="12" :lg="6">
            <StatCard
              title="Present Days"
              :value="summary?.present_days ?? 0"
              color="text-green-600"
            />
          </a-col>

          <a-col :span="24" :md="12" :lg="6">
            <StatCard
              title="Absent Days"
              :value="summary?.absent_days ?? 0"
              color="text-red-600"
            />
          </a-col>

          <a-col :span="24" :md="12" :lg="6">
            <StatCard
              title="Attendance Rate"
              :value="attendanceRate + '%'"
              color="text-blue-600"
            />
          </a-col>

          <a-col :span="24" :md="12" :lg="6">
            <StatCard
              title="Performance"
              :value="performanceGrade"
              :color="performanceColor"
            />
          </a-col>
        </a-row>

        <!-- ===================== CHART ===================== -->
        <div class="bg-white rounded-2xl shadow-lg p-8 mb-12">
          <h2 class="text-2xl font-bold text-slate-800 mb-6 text-center">
            Attendance Overview
          </h2>

          <div class="max-w-lg mx-auto">
            <AttendanceChart
              :present-days="summary?.present_days ?? 0"
              :absent-days="summary?.absent_days ?? 0"
            />
          </div>

          <p class="text-center mt-6 text-slate-600">
            Total Days:
            <span class="font-semibold text-slate-800">{{ totalDays }}</span>
          </p>
        </div>

        <!-- ===================== TABLE ===================== -->
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div class="p-6 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-slate-800">
                Attendance History
              </h2>
              <p class="text-sm text-slate-600 mt-1">
                Detailed daily attendance records
              </p>
            </div>

            <a-tag color="blue" class="text-sm px-3 py-1">
              {{ history.length }} Records
            </a-tag>
          </div>

          <a-table
            :columns="columns"
            :data-source="history"
            :row-key="record => record.id"
            :pagination="{ pageSize: 10 }"
          >
            <template #bodyCell="{ column, record, index }">

              <!-- S/N -->
              <template v-if="column.key === 'index'">
                {{ index + 1 }}
              </template>

              <!-- Status -->
              <template v-else-if="column.key === 'status'">
                <a-tag :color="statusColor(record.status)">
                  {{ record.status?.toUpperCase() }}
                </a-tag>
              </template>

            </template>
          </a-table>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import api from '~/utils/api'
import { message } from 'ant-design-vue'

import AttendanceChart from '@/components/attendance/AttendanceChart.vue'

/* ===================== STATE ===================== */
const loading = ref(true)
const summary = ref<any>(null)
const history = ref<any[]>([])

/* ===================== COMPUTED ===================== */
const totalDays = computed(
  () => (summary.value?.present_days ?? 0) + (summary.value?.absent_days ?? 0)
)

const attendanceRate = computed(() => {
  if (!totalDays.value) return 0
  return Math.round((summary.value.present_days / totalDays.value) * 100)
})

const performanceGrade = computed(() => {
  const r = attendanceRate.value
  if (r >= 95) return 'Excellent'
  if (r >= 85) return 'Good'
  if (r >= 70) return 'Average'
  return 'Needs Improvement'
})

const performanceColor = computed(() => {
  const r = attendanceRate.value
  if (r >= 95) return 'text-green-600'
  if (r >= 85) return 'text-blue-600'
  if (r >= 70) return 'text-yellow-600'
  return 'text-red-600'
})

/* ===================== TABLE ===================== */
const columns = [
  { title: 'S/N', key: 'index' },
  { title: 'Date', dataIndex: 'attendance_date' },
  { title: 'Status', key: 'status' },
  { title: 'Check In', dataIndex: 'check_in' },
  { title: 'Check Out', dataIndex: 'check_out' }
]

const statusColor = (status: string) => {
  if (status === 'present') return 'green'
  if (status === 'absent') return 'red'
  return 'orange'
}

/* ===================== FETCH ===================== */
const fetchData = async () => {
  loading.value = true
  try {
    const [summaryRes, historyRes] = await Promise.all([
      api.get('/employee/attendance/summary'),
      api.get('/employee/attendance/history')
    ])

    summary.value = summaryRes.data
    history.value = historyRes.data?.data ?? historyRes.data ?? []
  } catch (e) {
    console.error(e)
    message.error('Failed to load attendance data')
    history.value = []
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.ant-spin-container {
  transition: opacity 0.4s ease;
}
</style>
