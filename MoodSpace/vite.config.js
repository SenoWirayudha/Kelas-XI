import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    /*
      WORKAROUND: Vite 8 (Rolldown) + @vitejs/plugin-react v6 + Oxc JSX transformer
      defaults to development:true, emitting jsxDEV → react/jsx-dev-runtime even in
      production builds. This causes 25% larger bundles + createTask/console.createTask
      runtime overhead (53% self-time in profiler), making bounce/jitter during canvas
      panning/zoom (Workspace.jsx) appear as dev-only artifact in production.

      Remove this plugin when @vitejs/plugin-react v7+ sets oxc.jsx.development=false
      automatically in production builds.
    */
    {
      name: 'fix-jsx-dev-runtime',
      enforce: 'post',
      config() {
        return {
          oxc: {
            jsx: {
              development: false,
            },
          },
        }
      },
    },
  ],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        proxyTimeout: 120_000,
        timeout: 120_000,
      },
    },
  },
})
