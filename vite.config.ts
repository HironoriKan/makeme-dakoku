import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
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
