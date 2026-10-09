import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    utils: 'src/utils/index.ts',
  },
  format: ['esm'],
  dts: true,
  outDir: 'dist',
  clean: false,
  splitting: false,
  outExtension() {
    return {
      js: '.mjs',
    }
  },
})
