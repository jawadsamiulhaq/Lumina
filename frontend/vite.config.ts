import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // The app ships as a single optimized bundle (~208kB gzip); raise the advisory limit.
    chunkSizeWarningLimit: 900,
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API + uploaded files to the ASP.NET Core backend so the SPA is same-origin
      // (keeps the httpOnly refresh cookie first-party over http during development).
      '/api': {
        target: 'http://localhost:5065',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5065',
        changeOrigin: true,
      },
    },
  },
})
