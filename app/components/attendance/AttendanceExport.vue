<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import api from '~/utils/api'

import { DownloadOutlined } from '@ant-design/icons-vue'
const open = ref(false)
const loading = ref(false)

const from = ref<string | null>(null)
const to = ref<string | null>(null)
const departmentId = ref<string | null>(null)
const exportType = ref<'excel' | 'pdf'>('excel')

const departments = ref<any[]>([])

/* Load departments */
onMounted(async () => {
  try {
    const res = await api.get('/departments')
    departments.value = res.data.data ?? res.data
  } catch {
    message.error('Failed to load departments')
  }
})

const download = async () => {
  if (!from.value || !to.value) {
    message.warning('Please select date range')
    return
  }

  loading.value = true

  try {
    const url =
      exportType.value === 'excel'
        ? '/admin/attendance/export/excel'
        : '/admin/attendance/export/pdf'

    const response = await api.get(url, {
      params: {
        from: from.value,
        to: to.value,
        department_id: departmentId.value,
      },
      responseType: 'blob',
    })

    const mime =
      exportType.value === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf'

    const filename =
      exportType.value === 'excel'
        ? 'attendance-report.xlsx'
        : 'attendance-report.pdf'

    const blob = new Blob([response.data], { type: mime })
    const link = document.createElement('a')

    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()

    URL.revokeObjectURL(link.href)

    message.success('Export started')
    open.value = false
  } catch (e) {
    console.error(e)
    message.error('Export failed')
  } finally {
    loading.value = false
  }
}
</script>

<template>
 <a-button type="primary" @click="open = true">
  <DownloadOutlined class="text-white mt-2" style="color: white;"/>
  Export Attendance
</a-button>


  <!-- Export Modal -->
  <a-modal
    v-model:open="open"
    title="Export Attendance"
    :confirm-loading="loading"
    @ok="download"
    ok-text="Download"
  >
    <a-form layout="vertical">
      <!-- Date Range -->
      <a-form-item label="From date" required>
        <a-date-picker
          v-model:value="from"
          value-format="YYYY-MM-DD"
          class="w-full"
        />
      </a-form-item>

      <a-form-item label="To date" required>
        <a-date-picker
          v-model:value="to"
          value-format="YYYY-MM-DD"
          class="w-full"
        />
      </a-form-item>

      <!-- Department -->
      <a-form-item label="Department (optional)">
        <a-select
          v-model:value="departmentId"
          allow-clear
          placeholder="Select department"
        >
          <a-select-option
            v-for="dept in departments"
            :key="dept.id"
            :value="dept.id"
          >
            {{ dept.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- Export Type -->
      <a-form-item label="Export Format">
        <a-radio-group v-model:value="exportType">
          <a-radio value="excel">Excel</a-radio>
          <a-radio value="pdf">PDF</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>
