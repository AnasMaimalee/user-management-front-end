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
        <!-- Toggle Button - Blue icon -->
        <a-button @click="collapsed = !collapsed" type="text" class="text-blue-600 hover:text-blue-700">
          <icon 
            :name="collapsed ? 'heroicons:chevron-right-20-solid' : 'heroicons:chevron-left-20-solid'" 
            class="w-5 h-5"
          />
        </a-button>
      </div>

      <!-- User Info Section (Hidden when collapsed) -->
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

      <!-- Menu Items -->
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
            class="mx-3 rounded-lg mb-1 transition-all group"
            :class="currentRoute === menu.route ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-100'"
          >
            <div class="flex items-center gap-4">
              <!-- All icons: Blue by default -->
              <icon
                :name="menu.icon || 'heroicons:cube-20-solid'"
                class="w-6 h-6 flex-shrink-0 text-blue-600"
                :class="currentRoute === menu.route ? 'text-blue-700' : 'group-hover:text-blue-700'"
              />
              <!-- Title (Hidden when collapsed) -->
              <span class="text-base truncate">{{ menu.title }}</span>
            </div>
          </a-menu-item>
        </a-menu>
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
            <a-avatar size="default" style="background-color:#1677ff">
              {{ firstName.charAt(0).toUpperCase() }}
            </a-avatar>
            <div class="hidden md:block mt-4">
              <p class="font-medium text-gray-800">{{ firstName }}</p>
            </div>
          </div>
          <template #overlay>
            <a-menu class="shadow-lg">
              <a-menu-item @click="router.push('/profile')">
                <icon name="heroicons:user-20-solid" class="w-4 h-4 mr-2 text-blue-600" />
                Profile
              </a-menu-item>
              <a-menu-item @click="router.push('/setting/profile')">
                <icon name="heroicons:cog-8-tooth-20-solid" class="w-4 h-4 mr-2 text-blue-600" />
                Settings
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item danger @click="logout">
                <icon name="heroicons:arrow-right-on-rectangle-20-solid" class="w-4 h-4 mr-2 text-red-600" />
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

const currentPageTitle = computed(() => {
  const path = route.path
  if (path === '/dashboard') return 'Dashboard'
  if (path.startsWith('/employees')) return 'Employees'
  if (path.startsWith('/departments')) return 'Departments'
  if (path.startsWith('/ranks')) return 'Job Ranks'
  if (path.startsWith('/branches')) return 'Branches'
  return 'Dashboard'
})

// Map backend icon strings to nuxt-icon names (blue theme)
const menuIconMap: Record<string, string> = {
  HomeOutlined: 'heroicons:home-20-solid',
  Dashboard: 'heroicons:chart-pie-20-solid',
  Employees: 'heroicons:user-group-20-solid',
  Departments: 'heroicons:building-office-2-20-solid',
  Ranks: 'heroicons:academic-cap-20-solid',
  Branches: 'heroicons:map-pin-20-solid',
  Settings: 'heroicons:cog-8-tooth-20-solid',
  Profile: 'heroicons:user-20-solid',
}

const defaultMenus = [
  { title: 'Dashboard', route: '/dashboard', icon: 'heroicons:home-20-solid' },
]
const menus = computed(() => {
  const backendMenus = auth.user?.menus || []

  // Only show items allowed for this user's role
  const role = auth.user?.role
  const filteredMenus = backendMenus.filter((menu: any) => {
    if (!menu.roles) return true // show if roles not defined
    return menu.roles.includes(role)
  })

  return [...defaultMenus, ...filteredMenus.map((menu: any) => ({
    title: menu.title,
    route: menu.route,
    icon: menuIconMap[menu.icon] || menuIconMap[menu.title] || 'heroicons:cube-20-solid',
  }))]
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
/* Force ALL icons to blue - Maximum priority */
:deep(.icon),
:deep(svg) {
  color: #1677ff !important;
  fill: #1677ff !important;
}

/* Active darker blue */
:deep(.ant-menu-item-selected .icon),
:deep(.ant-menu-item-selected svg) {
  color: #1d4ed8 !important;
  fill: #1d4ed8 !important;
}

/* Hover darker blue */
:deep(.ant-menu-item:hover .icon),
:deep(.ant-menu-item:hover svg) {
  color: #1d4ed8 !important;
  fill: #1d4ed8 !important;
}

/* Toggle button icon */
:deep(.ant-btn .icon),
:deep(.ant-btn svg) {
  color: #1677ff !important;
  fill: #1677ff !important;
}

/* Active menu item */
:deep(.ant-menu-item-selected) {
  background-color: #e6f4ff !important;
  color: #1677ff !important;
  border-right: 4px solid #1677ff;
  font-weight: 500;
}

/* Hover effect */
:deep(.ant-menu-item:hover:not(.ant-menu-item-selected)) {
  background-color: #f0f9ff !important;
}
</style>