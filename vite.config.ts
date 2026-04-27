import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";

import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  // Приложение публикуется по адресу https://minitest.bitrixabd.ru/inventory/
  // — поэтому все ассеты должны загружаться с префиксом /inventory/.
  // В dev-режиме base = '/' (по умолчанию), чтобы не ломать локальную разработку.
  base: process.env.NODE_ENV === 'production' ? '/inventory/' : '/',

  plugins: [
    react(),
    tailwindcss(),
    // DO NOT REMOVE
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  server: {
    proxy: {
      '/bitrix': {
        target: 'https://minitest.bitrixabd.ru',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
