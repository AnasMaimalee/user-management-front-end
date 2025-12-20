<template>
  <div class="min-h-screen flex bg-slate-100 dark:bg-slate-900">

    <!-- Sidebar -->
    <aside
      :class="[
        'h-screen bg-slate-900 text-slate-200 transition-all duration-300 flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      ]"
    >
      <!-- Logo -->
      <div class="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        <span v-if="!collapsed" class="font-semibold text-lg tracking-wide">
          DaisyCorp
        </span>
        <button
          @click="collapsed = !collapsed"
          class="text-slate-400 hover:text-white"
        >
          ☰
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-2 py-4 space-y-1">
        <SidebarLink to="/dashboard" icon="📊" label="Dashboard" :collapsed="collapsed" />
        <SidebarLink to="/users" icon="👥" label="Users" :collapsed="collapsed" />
        <SidebarLink to="/transactions" icon="💳" label="Transactions" :collapsed="collapsed" />
        <SidebarLink to="/settings" icon="⚙️" label="Settings" :collapsed="collapsed" />
      </nav>

      <!-- Logout -->
      <div class="p-3 border-t border-slate-800">
        <button
          @click="logout"
          class="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm transition"
        >
          <span v-if="!collapsed">Logout</span>
          <span v-else>⏻</span>
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex-1 flex flex-col">

      <!-- Topbar -->
      <header class="h-16 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-between px-6">
        <h1 class="text-lg font-semibold text-slate-700 dark:text-slate-100">
          Dashboard
        </h1>

        <div class="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search"
            class="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600
                   bg-white dark:bg-slate-700 text-sm focus:outline-none"
          />
          <div class="w-9 h-9 rounded-full bg-indigo-500 text-white flex items-center justify-center font-medium">
            A
          </div>
        </div>
      </header>

      <!-- Page -->
      <main class="flex-1 p-6">
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
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import SidebarLink from '~/components/SidebarLink.vue'

const collapsed = ref(false)
const auth = useAuthStore()
const year = computed(() => new Date().getFullYear())

const logout = () => auth.logout()
</script>
