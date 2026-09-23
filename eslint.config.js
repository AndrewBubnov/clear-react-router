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
    // Framework-free core: these modules must never import React directly.
    // React code lives in components/, hooks/, instance.ts and the lazy/renderElement utils.
    files: [
      'src/clear-router/create.ts',
      'src/clear-router/types.ts',
      'src/clear-router/constants.ts',
      'src/clear-router/runtime/**/*.ts',
      'src/clear-router/config/**/*.ts',
      'src/clear-router/creators/**/*.ts',
      'src/clear-router/utils/utils.ts',
      'src/clear-router/utils/isCacheItemFresh.ts',
      'src/clear-router/utils/findRoute.ts',
      'src/clear-router/utils/commitState.ts',
      'src/clear-router/utils/commitNavigation.ts',
    ],
    rules: {
      'no-restricted-imports': ['error', {
        paths: [{
          name: 'react',
          message: 'Core modules must stay framework-free. Put React code in components/, hooks/, instance.ts or the lazy/renderElement utils.',
        }],
      }],
    },
  },
])
