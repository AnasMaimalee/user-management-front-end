<template>
  <div class="min-h-screen flex  ">

    <!-- Sidebar -->
    <aside
      :class="[
        'h-screen  text-slate-200 transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-between px-4 border-b">
        <span v-if="!collapsed" class="font-semibold text-lg text-blue-500 tracking-wide">
          Maimalee
        </span>
        <a-button
          @click="collapsed = !collapsed"
          class=""
        >
          ☰
        </a-button>
      </div>
      <div class="mt-6 flex items-center gap-3">
        <!-- Avatar Circle -->
        <!-- <div
          class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600
                flex items-center justify-center text-white font-semibold uppercase shadow"
        >
          {{ firstName.charAt(0) }}
        </div>

        <div class="leading-tight">
          <p class="text-xs uppercase tracking-wide text-slate-400">
            Welcome back
          </p>
          <p class="text-lg font-semibold text-blue-500">
            {{ firstName }}
          </p>
        </div>-->
      </div> 

      <!-- Menu -->
      <a-menu
        theme="light"
        mode="inline"
        :inline-collapsed="collapsed"
        class="h-full border-r-0 mt-5"
      >
        <a-menu-item
          v-for="menu in menus"
          :key="menu.route"
          @click="navigate(menu.route)"
        >
          <component
            :is="icons[menu.icon] || DefaultIcon"
            class="mr-2"
          />
          <span>{{ menu.title }}</span>
        </a-menu-item>
      </a-menu>

      <!-- Logout -->
      <div class="p-3 border-t ">
        <a-button
          danger
          block
          size="small"
          @click="logout"
        >
          Logout
        </a-button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col">

      <!-- Topbar -->
      <header class="h-16 bg-white shadow-sm flex items-center justify-between px-6">
        <h1 class="text-lg text-primary font-semibold">
          Dashboard
        </h1>

        <div class="flex items-center gap-4">
          
        </div>
      </header>

      <!-- Page -->
      <main class="flex-1 p-6 bg-gray-100">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="text-center text-sm text-slate-500 py-3">
        © {{ year }} DaisyCorp
      </footer>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

// Ant Design Icons
import {
  HomeOutlined,
  SettingOutlined,
  UserOutlined,
  AppstoreOutlined
} from '@ant-design/icons-vue'

const auth = useAuthStore()
const router = useRouter()

const firstName = computed(() => {
  if (!auth.user?.name) return ''
  return auth.user.name.split(' ')[0]
})

const collapsed = ref(false)
const year = computed(() => new Date().getFullYear())

// Map backend icon string → actual component
const icons: Record<string, any> = {
  HomeOutlined,
  SettingOutlined,
  UserOutlined,
  AppstoreOutlined,
}

const DefaultIcon = AppstoreOutlined

const menus = computed(() => auth.user?.menus || [])

const navigate = (route: string) => {
  router.push(route)
}

const logout = () => {
  auth.logout()
}

onMounted(() => {
  if (auth.token && !auth.user) {
    auth.fetchUser()
  }
})
</script>


