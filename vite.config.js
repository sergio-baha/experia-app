import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon-experia.png', 'logo-ceinfes.png'],
      manifest: {
        name: 'Experia · CEINFES — Formación Docente',
        short_name: 'Experia',
        description: 'Plataforma de formación docente en Diseño Centrado en Experiencias (DCE)',
        theme_color: '#E8732C',
        background_color: '#F9FAFB',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'favicon-experia.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'favicon-experia.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        // Cachea solo assets estáticos del shell (no datos de Supabase)
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
        // Las ilustraciones de los tutores (~160 KB c/u) y el kit de avatares
        // (DiceBear + estilo Lorelei, ~320 KB) solo los necesita quien está
        // dentro de un curso temático: se descargan bajo demanda, no en el
        // precaché de todos los usuarios.
        // La rejilla de recomendaciones y tareas (~60 KB) va por el mismo
        // criterio: solo la baja el docente del piloto clon al abrir su tabla
        // de efectividad.
        globIgnores: [
          '**/tutores/**',
          // Banco de actividades (rompehielos / pausas activas, ~4.6 MB): se
          // descarga solo al abrir el módulo que muestra la actividad.
          '**/actividades/**',
          // Diapositivas de la estructura de la Prueba Saber (~4.6 MB, módulo 2).
          '**/estructura-saber/**',
          '**/avatarKit-*.js', '**/avatarBody-*.js',
          '**/AvatarStudio-*.js', '**/AvatarChip-*.js', '**/LiveAvatar-*.js',
          '**/rejillaTareas-*.js', '**/rejillaSociales-*.js',
          // Banco de preguntas de las rondas en vivo (~200 KB): solo lo baja el
          // tutor al abrir "Elegir del banco". Sus imágenes, igual.
          '**/questionBank-*.js', '**/preguntas/**',
          // KaTeX (fórmulas de las preguntas, ~280 KB + fuentes): se baja la
          // primera vez que se pinta una fórmula.
          '**/katex*', '**/KaTeX_*',
        ],
        navigateFallback: '/index.html',
        // Excluye las llamadas a la API de Supabase del caché
        navigateFallbackDenylist: [/^\/rest\//, /^\/auth\//],
        runtimeCaching: [],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react':    ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-xlsx':     ['xlsx'],
        },
      },
    },
  },
})
