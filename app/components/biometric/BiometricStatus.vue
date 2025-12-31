<script setup lang="ts">
defineProps<{
  employee?: any   // <-- make it optional
}>()

defineEmits(['updated'])
</script>

<template>
  <!-- Guard the entire component -->
  <a-descriptions
    v-if="employee"
    title="Biometric Status"
    bordered
  >

    <a-descriptions-item label="Enrollment">
      <a-tag v-if="employee.biometric_uid" color="green">
        Enrolled
      </a-tag>
      <a-tag v-else color="red">
        Not Enrolled
      </a-tag>
    </a-descriptions-item>

    <a-descriptions-item
      v-if="employee.biometric_uid"
      label="Biometric UID"
    >
      {{ employee.biometric_uid }}
    </a-descriptions-item>

    <a-descriptions-item label="Action">
      <BiometricEnrollButton
        v-if="!employee.biometric_uid"
        :employee-id="employee.id"
        @success="$emit('updated')"
      />

      <BiometricResetButton
        v-else
        :employee-id="employee.id"
        @success="$emit('updated')"
      />
    </a-descriptions-item>

  </a-descriptions>

  <!-- Optional fallback -->
  <a-skeleton v-else active />
</template>
