<template>
  <a-table
    :columns="columns"
    :data-source="data"
    row-key="id"
    :loading="loading"
    bordered
  >
    <template #bodyCell="{ column, record, index }">
      <template v-if="column.key === 'index'">{{ index + 1 }}</template>
      <template v-else-if="column.key === 'employee'">
        <div class="flex items-center gap-3">
          <a-avatar
            :size="40"
            class="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold"
          >
            {{ getInitials(record.user?.employee) }}
          </a-avatar>
          <div>
            <div class="font-medium text-slate-800">{{ fullName(record.user?.employee) }}</div>
            <div class="text-xs text-slate-500">{{ record.user?.employee?.email || '—' }}</div>
          </div>
        </div>
      </template>
      <template v-else-if="column.key === 'dates'">
        <div>
          <div>{{ formatDate(record.start_date) }} → {{ formatDate(record.end_date) }}</div>
          <div class="text-xs text-slate-500 mt-1">Resume: {{ formatDate(record.resume_date) }}</div>
        </div>
      </template>
      <template v-else-if="column.key === 'reason'">
        <div>
          <span class="text-slate-600">{{ record.reason || '—' }}</span>
          <div class="text-xs text-slate-500 mt-2">
            {{ isHistory ? 'Processed' : 'Requested' }}: {{ formatDate(record.created_at) }}
          </div>
        </div>
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

    <template #emptyText>
      <div class="py-16 text-center">
        <div class="text-8xl text-slate-100 mb-4">📋</div>
        <p class="text-2xl font-medium text-slate-700">No records found</p>
        <p class="text-slate-500">Try adjusting the filters</p>
      </div>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'

defineProps<{
  columns: any[]
  data: any[]
  loading: boolean
  isHistory?: boolean
}>()

const fullName = (e: any) => e ? `${e.first_name || ''} ${e.last_name || ''}`.trim() : 'Unknown'
const getInitials = (e: any) => e ? `${e.first_name?.[0] || ''}${e.last_name?.[0] || ''}`.toUpperCase() : 'NA'
const formatDate = (d: string | null) => d ? dayjs(d).format('MMM D, YYYY') : '—'
const statusText = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'
const statusColor = (s: string) => s === 'approved' ? 'green' : s === 'rejected' ? 'volcano' : 'orange'
</script>