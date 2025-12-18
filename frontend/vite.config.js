import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      // /images 代理已移除，使用 public 目录下的静态资源
      // 如果需要访问后端的其他图片，可以使用不同的路径如 /backend-images
    },
  },
  build: {
    outDir: '../src/main/resources/static/react-dist',
    emptyOutDir: true,
  },
})
