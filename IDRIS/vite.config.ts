import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from "rollup-plugin-visualizer";
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), visualizer({ open: true, filename: 'stats.html', template: 'flamegraph' }) as PluginOption],
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
