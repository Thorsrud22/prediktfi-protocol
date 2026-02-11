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
    alias: [
      { find: 'langfuse', replacement: path.resolve(__dirname, './tests/mocks/langfuse.ts') },
      { find: '@google/genai', replacement: path.resolve(__dirname, './tests/mocks/google-genai.ts') },
      { find: 'posthog-js/react', replacement: path.resolve(__dirname, './tests/mocks/posthog-react.ts') },
      { find: 'posthog-js', replacement: path.resolve(__dirname, './tests/mocks/posthog.ts') },
      { find: /^@\/lib/, replacement: path.resolve(__dirname, './src/lib') },
      { find: /^@\/app/, replacement: path.resolve(__dirname, './app') },
      { find: '@', replacement: path.resolve(__dirname, './') },
      { find: '~/', replacement: path.resolve(__dirname, './') },
    ],
  },
});
