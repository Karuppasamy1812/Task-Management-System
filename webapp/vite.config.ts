import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react({ babel: { plugins: [['@babel/plugin-proposal-decorators', { legacy: true }]] } }),
    tailwindcss(),
  ],
  server: {
    port: 3001,
    strictPort: false,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
    },
  },
  resolve: {
    alias: [
      { find: '@api',     replacement: path.resolve(__dirname, './src/api') },
      { find: '@config',  replacement: path.resolve(__dirname, './src/lib/config/index.ts') },
      { find: '@queries', replacement: path.resolve(__dirname, './src/queries') },
      { find: '@utils',   replacement: path.resolve(__dirname, './src/lib/utils/index.ts') },
    ],
  },
  esbuild: { keepNames: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    css: false,
  },
})
