import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html to analyze bundle size
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  base: process.env.VITE_BASE_URL || '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Increase chunk size warning limit to 1000kb
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunking for better code splitting
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],

          // Material-UI core
          'mui-core': [
            '@mui/material',
            '@emotion/react',
            '@emotion/styled'
          ],

          // Material-UI icons and date pickers (large dependencies)
          'mui-extended': [
            '@mui/icons-material',
            '@mui/x-date-pickers'
          ],

          // React Query
          'query': ['@tanstack/react-query'],

          // Router
          'router': ['react-router', 'react-router-dom'],

          // Database and utilities
          'database': ['idb'],
          'utils': ['uuid', 'date-fns', 'zod'],

          // Form handling
          'forms': ['react-hook-form', '@hookform/resolvers'],
        },

        // Dynamic chunk naming for better caching
        chunkFileNames: () => {
          return `js/[name]-[hash].js`;
        },

        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name]-[hash].css';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },

    // Enable minification and tree shaking
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
      },
    },
  },
})
