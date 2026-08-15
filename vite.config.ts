import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // --- Build Optimizations ---
    build: {
      // Enable chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better cache performance
            'react-vendor': ['react', 'react-dom'],
            'motion-vendor': ['motion'],
            'icons-vendor': ['lucide-react'],
          },
        },
      },
      // Increase chunk size warning limit (our vendor chunks are expected to be large)
      chunkSizeWarningLimit: 800,
      // Enable source maps for production debugging
      sourcemap: false,
      // Minification
      minify: 'esbuild' as const,
      // Target modern browsers for smaller output
      target: 'es2020',
    },
    // --- Dev Server Optimizations ---
    optimizeDeps: {
      // Pre-bundle heavy dependencies for faster dev startup
      include: ['react', 'react-dom', 'motion', 'lucide-react'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
