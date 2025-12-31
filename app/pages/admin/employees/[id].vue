<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const { data: employee, refresh } = await useFetch(
  `/api/employees/${route.params.id}`
)
</script>

<template>
  <a-card title="Employee Details">

    <!-- 🔹 TABS START HERE -->
    <a-tabs>

      <!-- PROFILE TAB -->
      <a-tab-pane key="profile" tab="Profile">
        <a-descriptions bordered column="2">
          <a-descriptions-item label="Name">
            {{ employee?.name }}
          </a-descriptions-item>

          <a-descriptions-item label="Employee Code">
            {{ employee?.employee_code }}
          </a-descriptions-item>

          <a-descriptions-item label="Department">
            {{ employee?.department?.name }}
          </a-descriptions-item>
        </a-descriptions>
      </a-tab-pane>

      <!-- 🔐 BIOMETRIC TAB -->
      <a-tab-pane key="biometric" tab="Biometric">

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

        <div class="mt-4">
          <BiometricEnrollButton
            v-if="!employee?.biometric_uid"
            :employee-id="employee.id"
            @success="refresh"
          />
        </div>

      </a-tab-pane>

    </a-tabs>
    <!-- 🔹 TABS END HERE -->

  </a-card>
</template>
