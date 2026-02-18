
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Polyfill process.env para o navegador de forma segura
      // Em produção (Netlify), estas variáveis serão injetadas pelo ambiente de build se necessário,
      // mas o ideal é usar as funções serverless para não expor as chaves.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ''),
      'process.env.APIFY_TOKEN': JSON.stringify(env.APIFY_TOKEN || ''),
    },
    build: {
      outDir: 'dist',
    },
  };
});
