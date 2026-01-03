<template>
  <div class="flex justify-end gap-3 mt-6">
    <a-button type="default" @click="emit('refresh')" :loading="loading">
      <ReloadOutlined class="mr-2" />
      Refresh
    </a-button>

    <a-button
      v-if="hasData"
      type="primary"
      danger
      @click="emit('export-pdf')"
      :loading="exportingPDF"
    >
      Export PDF
    </a-button>
    <a-button
      v-if="hasData"
      type="primary"
      @click="emit('export-excel')"
      :loading="exportingExcel"
    >
      Export Excel
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { ReloadOutlined } from '@ant-design/icons-vue'

defineProps<{
  hasData: boolean
  loading: boolean
  exportingPDF: boolean
  exportingExcel: boolean
}>()

const emit = defineEmits(['refresh', 'export-pdf', 'export-excel'])
</script>