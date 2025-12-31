import tailwindcss from "@tailwindcss/vite";
import 'process'

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  routeRules: {
    // Proxy all API calls to Laravel
    '/api/**': { 
      proxy: 'http://172.24.24.69:8000/api/**' 
    },

    // Important: also proxy Sanctum CSRF endpoint
    '/sanctum/csrf-cookie': { 
      proxy: 'http://172.24.24.69:8000/sanctum/csrf-cookie' 
    },
  },
  
  runtimeConfig: {
    public: {
      pusherAppKey: process.env.PUBLIC_PUSHER_APP_KEY,
      pusherCluster: process.env.PUBLIC_PUSHER_CLUSTER,
      apiBase: process.env.PUBLIC_API_BASE,
    },
  },

  plugins: [
    '~/plugins/axios.client.ts',
    '~/plugins/antdv.client',
    '~/plugins/echo.client.ts'
   
    
  ],
   modules: [
    '@pinia/nuxt',
  ],

  devServer: {
    host: '0.0.0.0',
    port: 3001,
  },

  
});

