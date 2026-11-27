import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

import pkg from './package.json';

export default defineConfig({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png'],
      manifest: {
        id: './',
        name: 'Greenhouse Assistant',
        short_name: 'Greenhouse Assistant',
        description: 'تسجيل نمو المحصول والفحص الحشري في الصوب — يعمل بدون إنترنت',
        lang: 'ar',
        dir: 'rtl',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#ECF2F4',
        theme_color: '#0B4560',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        // ملفات قراءة العبوات (~10 ميجا) لا تدخل التخزين المسبق؛ تُحمَّل عند أول استخدام وتُحفظ بعدها
        globIgnores: ['ocr/**'],
        runtimeCaching: [
          { urlPattern: ({ url }: { url: URL }) => url.pathname.includes('/ocr/'), handler: 'CacheFirst',
            options: { cacheName: 'ocr-assets', expiration: { maxEntries: 10 }, cacheableResponse: { statuses: [200] } } },
        ],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          data: ['dexie', 'dexie-react-hooks', '@supabase/supabase-js'],
        },
      },
    },
  },
  test: { environment: 'node' }
} as any);
