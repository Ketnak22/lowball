import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: 'esm',
  target: 'node22',
  platform: 'node',
  clean: true,
  // The shared package ships TypeScript source, so it is bundled into the output.
  noExternal: ['@lowball/shared'],
});
