import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          'ui-vendor': ['lucide-react', 'react-beautiful-dnd']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  // 開発環境用プロキシ設定（本番環境では不要）
  server: {
    proxy: {
      '/api/line': {
        target: 'https://api.line.me',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/line/, ''),
        secure: true,
      }
    }
  }
});
