import { execFileSync } from 'node:child_process'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Regenerates src/playground/AppPaths.gen.ts from the route config.
// Never breaks dev/build: failures only warn, the committed snapshot stays.
const appPaths = (): Plugin => {
  const regenerate = () => {
    try {
      execFileSync(process.execPath, ['scripts/generate-app-paths.mjs'], { stdio: 'inherit' })
    } catch {
      console.warn('[app-paths] regeneration failed, continuing with committed snapshot')
    }
  }
  return {
    name: 'app-paths',
    buildStart: () => regenerate(),
    handleHotUpdate: ({ file }) => {
      if (file.replace(/\\/g, '/').endsWith('src/playground/routes.tsx')) regenerate()
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), appPaths()],
})
