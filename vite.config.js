import { defineConfig } from 'vite'

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist'
    ,
    rollupOptions: {
      // Avoid Rollup trying to resolve Tauri's runtime-only API during a plain Vite build
      external: ['@tauri-apps/api', '@tauri-apps/api/dialog']
    }
  }
})
