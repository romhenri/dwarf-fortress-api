import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// /api/* vai para a API FastAPI rodando em localhost:8000
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:8000', rewrite: (path) => path.replace(/^\/api/, '') },
    },
  },
})
