import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'next-env.d.ts',
      'node_modules/**',
      'src/services/**',
      'src/lib/**',
      'src/firebase/**',
      'src/types/**',
      'src/app/**',
      'src/scripts/**',
      'src/features/**',
      'src/components/**',
      'src/contexts/**',
      'src/hooks/**',
      'scripts/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      'no-unused-vars': 'off',
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
];
