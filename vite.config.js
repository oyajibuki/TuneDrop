import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/TuneDrop/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'TuneDrop',
        short_name: 'TuneDrop',
        description: '必要最低限で繋がる。5分で消える、今の思い。',
        theme_color: '#38bdf8',
        background_color: '#38bdf8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/TuneDrop/',
        scope: '/TuneDrop/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
