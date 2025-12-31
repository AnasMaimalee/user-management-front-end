<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const data = {
  labels: ['Present', 'Half Day', 'Absent'],
  datasets: [
    {
      data: [18, 1, 2],
    },
  ],
}
</script>

<template>
  <a-card title="Attendance Overview">
    <Bar :data="data" />
  </a-card>
</template>
