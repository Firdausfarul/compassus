import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true
  },
  optimizeDeps: {
    include: ['viem', 'viem/chains', 'viem/actions']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          viem: ['viem']
        }
      }
    }
  }
})
