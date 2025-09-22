import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { fileURLToPath } from 'url';

// Node 환경에서 __dirname 정의
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
      '@shared': path.resolve(__dirname, '../shared') // workspace나 npm 패키지로 변경 권장
    },
    extensions: ['.ts', '.tsx', '.js']
  },
  server: {
    fs: {
      // 개발 서버에서 shared 접근 허용
      allow: ['../shared']
    }
  },
  optimizeDeps: {
    include: ['react-router-dom', 'yet-another-react-lightbox', 'axios']
  },
  build: {
    rollupOptions: {
      // 외부 모듈을 빌드에서 제외
      external: ['../shared']
    },
    target: 'esnext', // 최신 브라우저 기준
    minify: 'esbuild' // esbuild로 minify
  },
  define: {
    // Vercel 배포에서 @swc/core NAPI 강제
    'process.env.SWC_FORCE_NAPI': '1'
  }
});
