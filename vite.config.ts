import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        },
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'i18n-vendor': ['i18next', 'react-i18next'],
            'icons': ['lucide-react']
          }
        }
      }
    },
    define: {
      __DDRAGON_VERSION__: JSON.stringify(env.VITE_DDRAGON_VERSION || '15.5.1'),
      __PROD_URL__: JSON.stringify(process.env.VERCEL_URL || 'http://localhost:3000')
    },
  };
});