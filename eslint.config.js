import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // Framework-free core: React is banned across the package by default...
    files: ['src/clear-router/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'react',
          message: 'Core modules must stay framework-free. Put React code in components/, hooks/, instance.ts or the lazy/renderElement utils.',
        }],
      }],
    },
  },
  {
    // ...except the React side, where it is explicitly allowed (later block wins).
    files: [
      'src/clear-router/components/**/*.{ts,tsx}',
      'src/clear-router/hooks/**/*.ts',
      'src/clear-router/index.ts',
      'src/clear-router/instance.ts',
      'src/clear-router/utils/lazy.ts',
      'src/clear-router/utils/createLazyComponent.tsx',
      'src/clear-router/utils/renderElement.tsx',
      'src/clear-router/__tests__/**/*.{ts,tsx}',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
])
