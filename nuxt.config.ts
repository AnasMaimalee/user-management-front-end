import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ['./app/assets/css/main.css'],
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  plugins: [
    '~/plugins/axios.client.ts',
    '~/plugins/antdv.client',
    '~/plugins/api.client.ts'
    
  ],
   modules: [
    '@pinia/nuxt',
  ],

  devServer: {
    host: '0.0.0.0',
    port: 3001,
  },

  
});

