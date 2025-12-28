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
        <a-button @click="collapsed = !collapsed" type="text" class="text-blue-600 hover:text-blue-700">
          <component
            :is="collapsed ? ChevronRightOutlined : ChevronLeftOutlined"
            class="w-5 h-5"
          />
        </a-button>
      </div>

      <!-- User Info (Hidden when collapsed) -->
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
              <!-- Dynamic Ant Design Icon from backend -->
              <component
                :is="iconComponents[menu.icon] || BoxPlotOutlined"
                class="w-6 h-6 flex-shrink-0 text-blue-600 group-hover:text-blue-700"
                :class="currentRoute === menu.route ? 'text-blue-700' : ''"
              />
              <span v-if="!collapsed" class="text-base truncate">{{ menu.title }}</span>
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

        <!-- User Dropdown -->
        <a-dropdown placement="bottomRight">
          <div class="flex items-center gap-3 cursor-pointer px-4 py-2 rounded-lg hover:bg-gray-100 transition">
            <a-avatar size="default" style="background-color:#1677ff">
              {{ firstName.charAt(0).toUpperCase() }}
            </a-avatar>
            <div class="hidden md:block">
              <p class="font-medium text-gray-800">{{ firstName }}</p>
            </div>
          </div>
          <template #overlay>
            <a-menu class="shadow-lg">
              <a-menu-item @click="router.push('/profile')">
                <UserOutlined class="mr-2" /> Profile
              </a-menu-item>
              <a-menu-item @click="router.push('/setting/profile')">
                <SettingOutlined class="mr-2" /> Settings
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item danger @click="logout">
                <LogoutOutlined class="mr-2" /> Logout
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

// Import ALL needed Ant Design icons
import {
  HomeOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  ApartmentOutlined,
  ProfileOutlined,
  BankOutlined,
  SettingOutlined,
  LogoutOutlined,
  WalletOutlined,
  MoneyCollectOutlined,
  DollarOutlined,
  PieChartOutlined,
  BarChartOutlined,
  CalendarOutlined,
  NotificationOutlined,
  BoxPlotOutlined,
  FieldTimeOutlined
  
} from '@ant-design/icons-vue'


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
  if (path.startsWith('/wallet')) return 'My Wallet'
  return 'Dashboard'
})

// Map backend icon names to Ant Design Vue components
const iconComponents: Record<string, any> = {
  HomeOutlined,
  UserOutlined,
  UsergroupAddOutlined,
  ApartmentOutlined,
  ProfileOutlined,
  BankOutlined,
  SettingOutlined,
  LogoutOutlined,
  WalletOutlined,
  MoneyCollectOutlined,
  DollarOutlined,
  PieChartOutlined,
  BarChartOutlined,
  CalendarOutlined,
  NotificationOutlined,
  BoxPlotOutlined,
  FieldTimeOutlined
  // Add more as needed
}

const defaultMenus = [
  { title: 'Dashboard', route: '/dashboard', icon: 'HomeOutlined' },
]

const menus = computed(() => {
  const backendMenus = auth.user?.menus || []

  const role = auth.user?.role
  const filteredMenus = backendMenus.filter((menu: any) => {
    if (!menu.roles) return true
    return menu.roles.includes(role)
  })

  return [...defaultMenus, ...filteredMenus.map((menu: any) => ({
    title: menu.title,
    route: menu.route,
    icon: menu.icon || 'BoxPlotOutlined', // fallback
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
/* Active menu item styling */
:deep(.ant-menu-item-selected) {
  background-color: #e6f4ff !important;
  color: #1677ff !important;
  border-right: 4px solid #1677ff;
  font-weight: 500;
}

:deep(.ant-menu-item-selected .anticon) {
  color: #1677ff !important;
}

/* Hover effect */
:deep(.ant-menu-item:hover:not(.ant-menu-item-selected)) {
  background-color: #f0f9ff !important;
  color: #1677ff !important;
}

:deep(.ant-menu-item:hover .anticon) {
  color: #1677ff !important;
}

/* Icons in dropdown */
:deep(.anticon) {
  color: #1677ff;
}
</style>