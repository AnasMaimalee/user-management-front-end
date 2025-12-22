<template>
  <div class="min-h-screen flex bg-gray-50">

    <!-- Sidebar -->
    <aside
      :class="[
        'flex flex-col bg-white shadow-xl transition-all duration-300 ease-in-out border-r border-gray-200',
        collapsed ? 'w-20' : 'w-72'
      ]"
    >
      <!-- Logo & Toggle -->
      <div class="h-16 flex items-center justify-between px-5 border-b border-gray-100">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-bold text-xl">
            M
          </div>
          <span v-if="!collapsed" class="font-bold text-xl text-gray-800">Maimalee</span>
        </div>
        <a-button @click="collapsed = !collapsed" type="text" class="text-gray-600 hover:text-gray-900">
          <icon :name="collapsed ? 'heroicons:chevron-right-20-solid' : 'heroicons:chevron-left-20-solid'" class="w-5 h-5" />
        </a-button>
      </div>

      <!-- User Info Section (Disappears when collapsed) -->
      <div v-if="!collapsed" class="px-5 py-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div class="flex items-center gap-4">
          <a-avatar size="large" style="background-color:#1677ff" class="shadow-md">
            {{ firstName.charAt(0).toUpperCase() }}
          </a-avatar>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-800 truncate">{{ auth.user?.name || 'Admin User' }}</p>
            <p class="text-xs text-gray-600 truncate">{{ auth.user?.email || 'admin@example.com' }}</p>
          </div>
        </div>
      </div>

      <!-- Menu -->
      <div class="flex-1 overflow-y-auto py-4">
        <a-menu
          theme="light"
          mode="inline"
          :inline-collapsed="collapsed"
          :selected-keys="[currentRoute]"
          class="border-r-0"
        >
          <a-menu-item
            v-for="menu in menus"
            :key="menu.route"
            @click="navigate(menu.route)"
            class="mx-2 rounded-lg mb-1 transition-all"
            :class="currentRoute === menu.route ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-100'"
          >
            <div class="flex items-center gap-3">
              <icon :name="icons[menu.icon] || 'heroicons:cube-20-solid'" class="w-5 h-5" />
              <span class="text-base">{{ menu.title }}</span>
            </div>
          </a-menu-item>
        </a-menu>
      </div>

      <!-- Logout at Bottom -->
      <div class="p-4 border-t border-gray-100">
        <a-button
          type="text"
          danger
          block
          @click="logout"
          class="flex items-center justify-center gap-3 hover:bg-red-50 transition"
        >
          <icon name="heroicons:arrow-right-on-rectangle-20-solid" class="w-5 h-5" />
          <span v-if="!collapsed">Logout</span>
        </a-button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Topbar -->
      <header class="h-16 bg-white shadow-sm flex items-center justify-between px-8 border-b border-gray-200">
        <h1 class="text-2xl font-semibold text-gray-800 capitalize">{{ currentPageTitle }}</h1>

        <!-- User Dropdown (Top Right) -->
        <a-dropdown placement="bottomRight">
          <div class="flex items-center gap-3 cursor-pointer px-4 py-2 rounded-lg hover:bg-gray-100 transition">
           
            <div class="hidden md:block">
              <p class="font-medium text-gray-800">{{ firstName }}</p>
            </div>
          </div>
          <template #overlay>
            <a-menu>
              <a-menu-item @click="router.push('/profile')">
                <icon name="heroicons:user-20-solid" class="w-4 h-4 mr-2" />
                Profile
              </a-menu-item>
              <a-menu-item @click="router.push('/settings')">
                <icon name="heroicons:cog-8-tooth-20-solid" class="w-4 h-4 mr-2" />
                Settings
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item danger @click="logout">
                <icon name="heroicons:arrow-right-on-rectangle-20-solid" class="w-4 h-4 mr-2" />
                Logout
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </header>

      <!-- Page Content -->
      <main class="flex-1 p-8 bg-gray-50 overflow-y-auto">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="text-center text-sm text-gray-500 py-4 border-t border-gray-200 bg-white">
        © {{ year }} Maimalee • HR Management System
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const collapsed = ref(false)
const year = computed(() => new Date().getFullYear())

const firstName = computed(() => {
  if (!auth.user?.name) return 'Admin'
  return auth.user.name.split(' ')[0]
})

const currentRoute = computed(() => route.path)

// Better page title from route
const currentPageTitle = computed(() => {
  const path = route.path
  if (path === '/dashboard') return 'Dashboard'
  if (path.startsWith('/employees')) return 'Employees'
  if (path.startsWith('/departments')) return 'Departments'
  if (path.startsWith('/ranks')) return 'Job Ranks'
  if (path.startsWith('/branches')) return 'Branches'
  return 'Dashboard'
})

// Icon mapping (using nuxt-icon names)
const icons: Record<string, string> = {
  HomeOutlined: 'heroicons:home-20-solid',
  UserOutlined: 'heroicons:user-group-20-solid',
  SettingOutlined: 'heroicons:cog-8-tooth-20-solid',
  AppstoreOutlined: 'heroicons:view-columns-20-solid',
  // Add more as needed
}

const defaultMenus = [
  { title: 'Dashboard', route: '/dashboard', icon: 'HomeOutlined' },
]

const menus = computed(() => {
  const backendMenus = auth.user?.menus || []
  const filtered = backendMenus.filter((menu: any) => menu.route !== '/dashboard')
  return [...defaultMenus, ...filtered]
})

const navigate = (path: string) => {
  if (route.path !== path) {
    router.push(path)
  }
}

const logout = () => {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  if (auth.token && !auth.user) {
    auth.fetchUser()
  }
})
</script>

<style scoped>
/* Active menu item highlight */
:deep(.ant-menu-item-selected) {
  background-color: #e6f4ff !important;
  color: #1677ff !important;
  border-right: 3px solid #1677ff;
}

/* Smooth scroll for menu */
.overflow-y-auto {
  scrollbar-width: thin;
}
</style>