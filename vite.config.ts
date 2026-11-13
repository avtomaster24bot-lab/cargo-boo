import { copyFileSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/cargo-boo/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'spa-github-pages-fallback',
      closeBundle() {
        const dist = resolve(import.meta.dirname, 'dist')
        const index = resolve(dist, 'index.html')
        copyFileSync(index, resolve(dist, '404.html'))
        for (const page of ['privacy', 'terms']) {
          const dir = resolve(dist, page)
          mkdirSync(dir, { recursive: true })
          copyFileSync(index, resolve(dir, 'index.html'))
        }
      },
    },
  ],
})
