import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: ['node_modules/**', '.next/**', 'dist/**', 'prediktfi-protocol/**'],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    files: [
      'app/studio/IdeaEvaluationReportNew.tsx',
      'app/studio/wizard/**/*.{ts,tsx}',
      'app/idea/[[]id[]]/page.tsx',
    ],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: [
      'app/studio/IdeaEvaluationReportNew.tsx',
      'app/studio/wizard/**/*.{ts,tsx}',
      'app/idea/[[]id[]]/page.tsx',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react/no-unescaped-entities': 'off',
      'prefer-const': 'off',
    },
  },
];
