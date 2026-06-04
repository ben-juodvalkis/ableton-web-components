import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Library build. Lit is bundled in by default for CDN/<script> friendliness;
// consumers using npm + a bundler will dedupe it themselves.
export default defineConfig({
  build: {
    // tsc runs first and emits .d.ts into dist; don't wipe them.
    emptyOutDir: false,
    cssFileName: 'theme',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    sourcemap: true,
    target: 'es2022',
  },
});
