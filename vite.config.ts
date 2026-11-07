import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    allowedHosts: [
      'sb-430f3t9p3p9c.vercel.run'
    ]
  }
  plugins: [
    vue(),
    tailwindcss(),
  ],
})
