<template>
  <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-md">
    <h3 class="text-lg font-semibold text-slate-800 mb-4">Filter Options</h3>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Employee</label>
        <a-select
          v-model:value="localFilters.employee"
          placeholder="All employees"
          :options="employeeOptions"
          show-search
          option-filter-prop="label"
          allow-clear
          class="w-full"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Department</label>
        <a-select
          v-model:value="localFilters.department"
          placeholder="All departments"
          :options="departmentOptions"
          allow-clear
          class="w-full"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Month</label>
        <a-select v-model:value="localFilters.month" placeholder="All" allow-clear class="w-full">
          <a-select-option :value="null">All</a-select-option>
          <a-select-option v-for="m in 12" :key="m" :value="m">
            {{ monthName(m) }}
          </a-select-option>
        </a-select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">Year</label>
        <a-select v-model:value="localFilters.year" placeholder="All" allow-clear class="w-full">
          <a-select-option :value="null">All</a-select-option>
          <a-select-option v-for="y in years" :key="y" :value="y">{{ y }}</a-select-option>
        </a-select>
      </div>
    </div>
    <div class="mt-6 flex justify-end">
      <a-button @click="emit('reset')">Reset Filters</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{
  filters: any
  employeeOptions: any[]
  departmentOptions: any[]
  years: number[]
}>()

const emit = defineEmits(['update:filters', 'reset'])

const localFilters = reactive({ ...props.filters })

watch(localFilters, (newVal) => {
  emit('update:filters', { ...newVal })
}, { deep: true })

const monthName = (m: number) => dayjs().month(m - 1).format('MMMM')
</script>