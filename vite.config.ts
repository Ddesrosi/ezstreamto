import { defineConfig, loadEnv } from 'vite';
console.log("🧪 VITE_DEEPSEEK_API_KEY depuis vite.config.ts =", process.env.VITE_DEEPSEEK_API_KEY);
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
  'import.meta.env.VITE_DEEPSEEK_API_KEY': JSON.stringify(env.VITE_DEEPSEEK_API_KEY),
},
    plugins: [react(), svgr()],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization'
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      cors: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization'
      },
    }
  };
});
