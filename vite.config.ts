import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    // ✅ FIX: Use 'esbuild' instead of 'terser' to prevent build crashes
    minify: 'esbuild', 
  },
  server: {
    port: 3000,
  }
});
