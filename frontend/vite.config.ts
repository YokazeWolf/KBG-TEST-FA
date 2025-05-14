import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar } from '@quasar/vite-plugin'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    quasar({
      sassVariables: '@/vars.scss',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
