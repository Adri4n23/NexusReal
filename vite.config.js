import { defineConfig } from 'vite'
import react from '@vitejs/api-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1600,
  }
})