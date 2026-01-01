<!-- components/attendance/AttendanceFilters.vue -->
<template>
  <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
    <a-range-picker
      v-model:value="localDateRange"
      :format="dateFormat"
      :placeholder="['Start Date', 'End Date']"
      class="w-full sm:w-80"
      size="large"
    />

    <a-button
      type="primary"
      size="large"
      :loading="loading"
      @click="applyFilter"
      class="w-full sm:w-auto"
    >
      Apply Filter
    </a-button>

    <a-button
      v-if="isFiltered"
      type="default"
      size="large"
      @click="resetFilter"
      class="w-full sm:w-auto"
    >
      Reset
    </a-button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'

const emit = defineEmits(['filter-change'])

const dateFormat = 'YYYY-MM-DD'
const localDateRange = ref<any[]>([])
const loading = ref(false)
const isFiltered = ref(false)

const applyFilter = async () => {
  if (!localDateRange.value || localDateRange.value.length !== 2) {
    message.warning('Please select both start and end dates')
    return
  }

  loading.value = true
  isFiltered.value = true

  const from = dayjs(localDateRange.value[0]).format(dateFormat)
  const to = dayjs(localDateRange.value[1]).format(dateFormat)

  emit('filter-change', { from, to })
  loading.value = false
}

const resetFilter = () => {
  localDateRange.value = []
  isFiltered.value = false
  emit('filter-change', null)
}

// Auto-apply when dates change (optional UX improvement)
watch(localDateRange, (newVal) => {
  if (newVal && newVal.length === 2) {
    // Optional: auto-apply after selection
    // applyFilter()
  }
})
</script>