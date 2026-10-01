import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Pubblicata su https://simonecarbini-creator.github.io/diet/
  base: '/diet/',
  plugins: [react(), tailwindcss()],
})
