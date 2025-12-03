import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // HTML에서 환경 변수 치환을 위한 플러그인
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        // 환경 변수에서 사이트 URL 가져오기 (기본값: Vercel 배포 URL)
        const siteUrl = process.env.VITE_SITE_URL || 'https://changhyun-two.vercel.app';
        return html.replace(/%VITE_SITE_URL%/g, siteUrl);
      },
    },
  ],
    build: {
      chunkSizeWarningLimit: 1000, // 500KB 경고를 1000KB로 상향 조정
    },
  server: {
    port: 3000,
    host: 'localhost',
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // WebSocket 지원
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
})

