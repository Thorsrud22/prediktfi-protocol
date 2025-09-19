/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      'tests-e2e/**',
      '**/e2e/**',
      '**/*.spec.ts', // Exclude Playwright spec files from vitest
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '~/': path.resolve(__dirname, './'),
    },
  },
});
