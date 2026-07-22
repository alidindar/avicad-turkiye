import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/got/',
  plugins: [react()],
  server: {
    watch: {
      // Video dosyalari surum kontrolune girmiyor ve buyuk; chokidar bunlari
      // izlerken Windows'ta EBUSY alip dev sunucusunu tamamen dusuruyor.
      ignored: ['**/public/video/**'],
    },
  },
})
