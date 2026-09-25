import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['icons/arcana.svg', 'decks/cathedral/**/*.svg', 'decks/cathedral/deck.json'],
      manifest: {
        name: 'Arcana',
        short_name: 'Arcana',
        description: 'A quiet, private tarot table for your own cards and questions.',
        theme_color: '#100c14',
        background_color: '#100c14',
        display: 'standalone',
        orientation: 'any',
        icons: [{ src: '/icons/arcana.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 2_000_000,
      },
      devOptions: { enabled: true },
    }),
  ],
  test: { environment: 'jsdom', setupFiles: './src/test-setup.ts' },
})
