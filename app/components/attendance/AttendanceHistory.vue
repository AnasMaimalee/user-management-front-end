<script setup lang="ts">
defineProps<{ rows: any[] }>()
</script>

<template>
  <a-card title="Attendance History">
    <a-table
      :data-source="rows"
      row-key="id"
      :pagination="false"
    >
      <a-table-column title="Date" dataIndex="attendance_date" />
      <a-table-column title="Status" dataIndex="status" />
      <a-table-column title="Worked (mins)" dataIndex="worked_minutes" />
      <a-table-column title="Late (mins)" dataIndex="late_minutes" />
    </a-table>
  </a-card>
</template>
