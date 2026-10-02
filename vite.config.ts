import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Pubblicata su https://simonecarbini-creator.github.io/diet/
  base: '/diet/',
  plugins: [
    react(),
    tailwindcss(),
    // Offline davvero (CLAUDE.md, regola 4): il service worker salva sul telefono tutti i file
    // dell'app e si aggiorna da solo quando esce una versione nuova.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      // Il manifest è public/site.webmanifest, dal kit del logo.
      manifest: false,
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,gif,ico,webmanifest,ics}'],
        // La GIF della schermata di avvio pesa circa 1 MB.
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
