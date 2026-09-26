import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { copyFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const pagesBase = '/arcana/'

export default defineConfig(({ command }) => {
  const base = command === 'build' ? pagesBase : '/'

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['icons/arcana.svg', 'decks/cathedral/backs/*.svg', 'decks/cathedral/**/*.svg', 'decks/cathedral/deck.json', 'decks/nocturne/backs/*.svg', 'decks/nocturne/**/*.svg', 'decks/nocturne/deck.json'],
        manifest: {
          name: 'Arcana',
          short_name: 'Arcana',
          description: 'A quiet, private tarot table for your own cards and questions.',
          start_url: base,
          scope: base,
          theme_color: '#100c14',
          background_color: '#100c14',
          display: 'standalone',
          orientation: 'any',
          icons: [{ src: 'icons/arcana.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,json,woff2}'],
          navigateFallback: `${base}index.html`,
          maximumFileSizeToCacheInBytes: 3_000_000,
        },
        devOptions: { enabled: true },
      }),
      ...(command === 'build' ? [{
        name: 'github-pages-spa-fallback',
        async writeBundle() {
          await copyFile(resolve('dist/index.html'), resolve('dist/404.html'))
        },
      }] : []),
    ],
    test: { environment: 'jsdom', setupFiles: './src/test-setup.ts' },
  }
})
