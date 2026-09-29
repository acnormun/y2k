import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    // three.js ships as its own ~580 kB chunk, loaded lazily after the desktop UI renders.
    chunkSizeWarningLimit: 600,
  },
})
