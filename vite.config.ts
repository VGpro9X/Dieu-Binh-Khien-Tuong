import { defineConfig } from 'vite';

export default defineConfig({
  // Dùng đường dẫn tương đối để bản build hoạt động ổn định trên GitHub Pages
  // và không phụ thuộc vào tên repository hay base URL cố định.
  base: './',
  server: {
    host: true,
    port: 5173,
  },
});
