<template>
  <a-card class="mb-6">
    <template #title>
      <div class="flex justify-between items-center">
        <h2 class="text-xl font-semibold text-slate-800">{{ title }}</h2>
        <div>
          <a-button type="primary" @click="exportPdf" :loading="pdfLoading" class="mr-2">
            Export PDF
          </a-button>
          <a-button type="primary" @click="exportExcel" :loading="excelLoading">
            Export Excel
          </a-button>
        </div>
      </div>
    </template>

    <a-table
      :columns="columns"
      :data-source="leaves"
      row-key="id"
      bordered
      :loading="loading"
      class="rounded-lg overflow-hidden"
    >
      <template #bodyCell="{ column, record, index }">
        <template v-if="column.key === 'index'">
          <span class="text-slate-600 font-semibold">{{ index + 1 }}</span>
        </template>

        <template v-else-if="column.key === 'employee'">
          <div class="flex items-center gap-3">
            <a-avatar
              :size="36"
              class="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold"
            >
              {{ getInitials(record.employee) }}
            </a-avatar>
            <div>
              <div class="font-medium text-slate-800">
                {{ fullName(record.employee) }}
              </div>
              <div class="text-xs text-slate-500">
                {{ record.employee?.email || '—' }}
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="column.key === 'dates'">
          <div class="text-sm">
            <div>{{ formatDate(record.start_date) }} → {{ formatDate(record.end_date) }}</div>
            <div class="text-xs text-slate-500 mt-1">
              Resume: {{ formatDate(record.resume_date) }}
            </div>
          </div>
        </template>

        <template v-else-if="column.key === 'reason'">
          <span class="text-slate-600">{{ record.reason || '—' }}</span>
        </template>

        <template v-else-if="column.key === 'status'">
          <a-tag :color="statusColor(record.status)">
            {{ statusText(record.status) }}
          </a-tag>
        </template>

        <template v-else-if="column.key === 'actions'">
          <slot name="actions" :record="record"></slot>
        </template>
      </template>
    </a-table>
  </a-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import dayjs from 'dayjs'
import api from '~/utils/api'
import { notification } from 'ant-design-vue'

const props = defineProps<{
  title: string
  leaves: any[]
  loading: boolean
}>()

const emit = defineEmits(['approve', 'reject'])

const pdfLoading = ref(false)
const excelLoading = ref(false)

const columns = [
  { title: '#', key: 'index', width: 60 },
  { title: 'Employee', key: 'employee', width: 260 },
  { title: 'Dates', key: 'dates', width: 220 },
  { title: 'Reason', key: 'reason' },
  { title: 'Status', key: 'status', width: 120 },
  { title: 'Actions', key: 'actions', width: 100 },
]

const fullName = (e: any) =>
  e ? `${e.first_name || ''} ${e.last_name || ''}`.trim() : 'Unknown'

const getInitials = (e: any) =>
  e ? `${e.first_name?.[0] || ''}${e.last_name?.[0] || ''}`.toUpperCase() : 'NA'

const formatDate = (d: string | null) =>
  d ? dayjs(d).format('MMM D, YYYY') : '—'

const statusText = (s: string) =>
  s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'

const statusColor = (s: string) =>
  s === 'approved' ? 'green' : s === 'rejected' ? 'red' : 'orange'

const exportPdf = async () => {
  pdfLoading.value = true
  try {
    const params = new URLSearchParams(window.location.search)
    const url = `/leaves/export-pdf/${props.type}?${params.toString()}`
    window.open(url, '_blank')
  } catch {
    notification.error({ message: 'PDF export failed' })
  } finally {
    pdfLoading.value = false
  }
}

const exportExcel = async () => {
  excelLoading.value = true
  try {
    const params = new URLSearchParams(window.location.search)
    const url = `/leaves/export-excel/${props.type}?${params.toString()}`
    window.open(url, '_blank')
  } catch {
    notification.error({ message: 'Excel export failed' })
  } finally {
    excelLoading.value = false
  }
}
</script>