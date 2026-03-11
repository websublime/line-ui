import { readFileSync } from 'node:fs';
import { extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { glob } from 'glob';
import { defineConfig } from 'vite';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

const files = glob.sync('./src/**/*.{ts,js}', { ignore: ['src/main.ts', 'src/types/**'] }).map((file) => {
  return [
    relative('src', file.slice(0, file.length - extname(file).length)),
    fileURLToPath(new URL(file, import.meta.url))
  ];
});

export default defineConfig({
  build: {
    lib: {
      entry: Object.fromEntries(files),
      formats: ['es']
    },
    minify: true,
    outDir: 'dist',
    rollupOptions: {
      external: ['lit', /^lit\/.*/],
      output: {
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'chunks/[name].js',
        entryFileNames: '[name].js'
      },
      treeshake: true
    }
  },
  define: {
    BUILD_VERSION: JSON.stringify(packageJson.version)
  }
});
