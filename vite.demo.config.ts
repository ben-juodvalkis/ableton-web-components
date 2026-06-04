import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Static demo / playground site -> deployed to GitHub Pages.
// Served from https://<user>.github.io/ableton-web-components/, so base is the repo name.
export default defineConfig({
  root: resolve(__dirname, 'demo'),
  base: '/ableton-web-components/',
  build: {
    outDir: resolve(__dirname, 'site'),
    emptyOutDir: true,
  },
});
