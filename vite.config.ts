import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/cache/**']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/dify-api': {
        target: 'https://dify.arkdoo.com.cn/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/dify-api/, ''),
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'axios', 'lucide-react'],
          markdown: ['react-markdown', 'rehype-raw']
        }
      }
    }
  }
})
