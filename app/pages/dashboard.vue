<template>
    <div class="min-h-screen flex flex-col bg-gray-100">


      <!-- Main -->
      <main class="flex-1 p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          <div class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
            <h2 class="text-lg font-semibold mb-2">Profile</h2>
            <p>
              Welcome,
              <span class="font-bold">{{ auth.user?.name }}</span>
            </p>
            <p>Email: {{ auth.user?.email }}</p>
          </div>

          <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-lg font-semibold mb-2">Stats</h2>
            <p>More features coming…</p>
          </div>

          <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-lg font-semibold mb-2">Messages</h2>
            <p>No new messages</p>
          </div>

        </div>
      </main>
    </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth',
})

const auth = useAuthStore()
</script>
