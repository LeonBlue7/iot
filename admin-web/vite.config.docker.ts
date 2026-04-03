import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Docker 环境专用 Vite 配置
// 支持容器化开发环境的热重载

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 允许外部访问（Docker 容器需要）
    host: true,
    port: 3001,
    // Docker volume 挂载需要 polling 模式
    watch: {
      usePolling: true,
      interval: 100,
    },
    proxy: {
      '/api': {
        // Docker 网络中使用服务名
        target: 'http://backend:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
})