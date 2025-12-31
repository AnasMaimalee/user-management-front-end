// plugins/echo.client.ts
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

export default defineNuxtPlugin(() => {
  if (process.server) return // only run in browser

  window.Pusher = Pusher

  const echo = new Echo({
    broadcaster: 'reverb',  // <-- Change this to 'reverb'
    key: 'local',           // Your Reverb app key (can be anything locally)
    wsHost: '127.0.0.1',
    wsPort: 8080,
    wssPort: 8080,           // Optional, but good to include
    forceTLS: false,
    disableStats: true,
    enabledTransports: ['ws'],
    authEndpoint: 'http://127.0.0.1:8000/broadcasting/auth',
    auth: {
      headers: {
        Authorization: `Bearer ${useCookie('auth_token').value}`
      }
    }
  })

  return {
    provide: {
      echo
    }
  }
})