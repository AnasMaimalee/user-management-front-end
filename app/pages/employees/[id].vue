<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useFetch } from '#app'

const route = useRoute()
const { data: employee } = await useFetch(
  `/api/employees/${route.params.id}`
)
</script>

<template>
  <a-card title="Employee Profile">

    <!-- Basic Info -->
    <a-descriptions bordered column="2">
      <a-descriptions-item label="Name">
        {{ employee?.name }}
      </a-descriptions-item>
      <a-descriptions-item label="Employee Code">
        {{ employee?.employee_code }}
      </a-descriptions-item>
    </a-descriptions>

    <!-- 🔐 BIOMETRIC STATUS (ADD HERE) -->
    <a-divider />

    <a-descriptions title="Biometric Status" bordered>
      <a-descriptions-item label="Enrollment">
        <a-tag v-if="employee?.biometric_uid" color="green">
          Enrolled
        </a-tag>
        <a-tag v-else color="red">
          Not Enrolled
        </a-tag>
      </a-descriptions-item>
    </a-descriptions>

  </a-card>
</template>
