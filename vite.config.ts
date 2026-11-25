/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Ruta base de publicación. GitHub Pages usa '/Lectura-rapida/'; un empaquetado nativo (fase 7) usará '/'.
const base = process.env.VITE_BASE ?? '/Lectura-rapida/'

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Lectura Rápida',
        short_name: 'Lectura',
        description: 'Entrena atención, lectura activa, velocidad flexible y retención.',
        lang: 'es',
        start_url: base,
        scope: base,
        display: 'standalone',
        share_target: {
          action: `${base}compartir`,
          method: 'GET',
          params: { title: 'title', text: 'text', url: 'url' },
        },
        background_color: '#fafaf9',
        theme_color: '#1d4ed8',
        icons: [
          { src: 'icons/pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,mjs,css,html,svg,png,ico,woff2}'],
        // El worker de pdfjs (~1 MB) se precachea para importar PDF sin conexión.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
