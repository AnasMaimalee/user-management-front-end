<template>
  <div class="min-h-screen flex bg-gray-50">

    <!-- Sidebar -->
    <aside
      :class="[
        'flex flex-col bg-white shadow-lg transition-all duration-300',
        collapsed ? 'w-20' : 'w-64'
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-between px-4 border-b">
        <span v-if="!collapsed" class="font-bold text-xl text-blue-600">Maimalee</span>
        <a-button @click="collapsed = !collapsed" type="text">
          ☰
        </a-button>
      </div>

      <!-- Menu -->
      <a-menu
        theme="light"
        mode="inline"
        :inline-collapsed="collapsed"
        class="flex-1 border-r-0 mt-5"
      >
        <a-menu-item
          v-for="menu in menus"
          :key="menu.route"
          @click="navigate(menu.route)"
          class="flex items-center gap-2"
        >
          <component :is="icons[menu.icon] || DefaultIcon" />
          <span v-if="!collapsed">{{ menu.title }}</span>
        </a-menu-item>
      </a-menu>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">

      <!-- Topbar -->
      <header class="h-16 bg-white shadow-sm flex items-center justify-between px-6">
        <h1 class="text-lg font-semibold text-gray-800">Dashboard</h1>

        <!-- User Dropdown -->
        <a-dropdown placement="bottomRight" trigger="hover">
          <div class="flex items-center gap-2 cursor-pointer px-3 py-1 rounded-md hover:bg-gray-100 transition">
            <a-avatar style="background-color:#1677ff" size="small">
              {{ firstName.charAt(0) }}
            </a-avatar>
            <span class="font-medium text-gray-700">{{ firstName }}</span>
          </div>
          <template #overlay>
            <a-menu>
              <a-menu-item danger @click="logout">Logout</a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </header>

      <!-- Page Slot -->
      <main class="flex-1 p-6 bg-gray-100">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="text-center text-sm text-gray-500 py-3">
        © {{ year }} Maimalee
      </footer>

    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

// Ant Design Icons
import { HomeOutlined, SettingOutlined, UserOutlined, AppstoreOutlined } from '@ant-design/icons-vue'

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

const defaultMenus = [
  { title: 'Dashboard', route: '/dashboard', icon: 'HomeOutlined' },
]

const menus = computed(() => {
  const backendMenus = auth.user?.menus || []
  const filteredBackendMenus = backendMenus.filter(menu => menu.route !== '/dashboard')
  return [...defaultMenus, ...filteredBackendMenus]
})

const navigate = (route: string) => {
  router.push(route)
}

const logout = () => {
  auth.logout()
}

onMounted(() => {
  if (auth.token && !auth.user) auth.fetchUser()
})
</script>

<style scoped>
/* Optional: smooth hover for menu items */
.a-menu-item:hover {
  background-color: #e6f7ff !important;
}
</style>
