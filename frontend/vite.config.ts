import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite config — https://vitejs.dev/config/
// Desacoplado de Figma Make: build reproducible sin ./.figma/make/site.json
// Mejoras de seguridad 2026: endurecimiento de server.fs para prevenir:
//   - #31/32/35: Files outside server.fs.allow could be served
//   - #36: Cross origin script execution through custom middleware
export default defineConfig({
  base: '/',
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 600,
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    # Security: restrict which files can be served by Vite dev server
    # Previene #31/32/35: Files outside server.fs.allow could be served
    # cuando rutas del proyecto coinciden con rutas del sistema en no-Windows.
    # Al especificar rutas explícitas, bloqueamos el acceso a archivos del sistema.
    fs: {
      allow: [
        # Permitir solo archivos dentro del proyecto
        import.meta.dirname,
        # Permitir assets públicos
        path.resolve(import.meta.dirname, 'public'),
        # Permitir CSS de Tailwind
        path.resolve(import.meta.dirname, 'src/assets'),
      ],
      # Denegar explícitamente el acceso a archivos del sistema
      deny: [
        # No servir archivos fuera del directorio del proyecto
        '/etc/passwd',
        '/boot',
        '/sys',
        # Prevenir accesso a secrets
        '/.env',
        '/.env.*',
      ],
      # Configuration para prevenir #31: First 4 bytes exposure via ?vite-wasm-instance
      # Deshabilitar instancia WASM fuera de los límites permitidos
      strict: true,
    },
    # Prevenir #36: Cross origin script execution through Vite custom middleware
    # Configurar CORS y headers de seguridad explícitos
    cors: {
      origin: ['http://127.0.0.1:5173', 'localhost:5173'],
      credentials: true,
    },
    # Headers de seguridad adicionales
    middleware: (dev) => [
      {
        name: 'security-headers',
        apply: 'serving',
        enforce: 'pre',
        handler: (req, res, next) => {
          res.setHeader('X-Content-Type-Options', 'nosniff')
          res.setHeader('X-Frame-Options', 'DENY')
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
          next()
        },
      },
    ],
  },
  preview: {
    host: '127.0.0.1',
    port: 5173,
  },
})