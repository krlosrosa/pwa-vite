import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  preview: {
    allowedHosts: ["pwa-vite.lilog.app"],
    host: true, // permite receber conexões externas
    port: 3000
  },
  plugins: [devtools(), viteReact(), tailwindcss(), VitePWA({
    
    registerType: 'autoUpdate', workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}']
    }
  })],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
