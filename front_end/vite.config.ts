import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    svgr()
  ],
  resolve: {
    alias: {
      '@front': path.resolve(__dirname, 'src'),               // front_end/src
      '@app': path.resolve(__dirname, 'src/app'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@api': path.resolve(__dirname, 'src/utils'),           // api.ts 위치
      '@shared': path.resolve(__dirname, '../shared')         // shared
    },
  },
  optimizeDeps: {
    include: [
      'react-router-dom',
      'yet-another-react-lightbox'
    ]
  }
});
