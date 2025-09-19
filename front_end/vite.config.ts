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
      '@front': path.resolve(__dirname, 'src'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@utils': path.resolve(__dirname, 'src/utils'),
      '@shared': path.resolve(__dirname, '../shared'), // services 폴더
    },
  },
  optimizeDeps: {
    include: [
      'react-router-dom',
      'yet-another-react-lightbox',
      'axios'
    ]
  }
});
