<template>
  <a-menu-item :key="to" @click="navigate">
    <template #icon>
      <component :is="icon" />
    </template>

    <span v-if="!collapsed">{{ label }}</span>
  </a-menu-item>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const props = defineProps<{
  to: string
  icon: any
  label: string
  collapsed: boolean
}>()

const navigate = () => {
  router.push(props.to)
}
</script>
