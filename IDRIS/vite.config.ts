import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // css: {
  //   preprocessorOptions: {
  //     scss: {
  //       additionalData: `@use "./src/styles/variables" as *;`
  //     }
  //   }
  // }
  server: {
    host: "0.0.0.0", // or use host: '0.0.0.0'
    port: 5173,
    watch: {
      usePolling: true,
    },
  },
  
})
