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
  // 注意：不打包 node_modules 依赖
  // 原因：某些依赖（如 pino）使用动态 require，无法被 ESM bundler 处理
  // 因此需要在部署时运行 npm install --production 安装运行时依赖
  // tsup 会自动保留源文件中的 shebang，不需要在 banner 中重复添加
});
