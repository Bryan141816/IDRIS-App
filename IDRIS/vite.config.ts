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
    host: true, // crucial so it's not restricted to localhost
    port: 5173,
  },
})
