import { notification } from 'ant-design-vue'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      notification,
    },
  }
})
