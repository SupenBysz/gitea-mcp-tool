import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  shims: true,
  // tsup 会自动保留源文件中的 shebang，不需要在 banner 中重复添加
});
