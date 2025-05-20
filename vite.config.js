
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/dataLogger/',
  publicDir: 'public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico', 
        'icon-192x192.png', 
        'icon-512x512.png'
      ],
      manifest: {
        name: 'DataLogger',
        short_name: 'DataLogger',
        description: 'Geographic Data Recording App',
        theme_color: '#ffffff',
		display: 'standalone',
		scope: '/dataLogger/',  
        start_url: '/dataLogger/',
        icons: [
          {
            src: 'icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,txt}']
      }
    })
  ],
  server: {
    port: 3000,
    open: true  // Automatically open browser
  },
  // Explicitly define build options
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  }
})
