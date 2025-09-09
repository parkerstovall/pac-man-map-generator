import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'
import pluginPrettier from 'eslint-plugin-prettier/recommended'
import unusedImports from 'eslint-plugin-unused-imports'

export default defineConfig([
  {
    files: ['**/*.{ts,jsx,tsx}'],
    plugins: { js, 'unused-imports': unusedImports },
    extends: ['js/recommended'],
    
  },
  {
    files: ['**/*.{ts,jsx,tsx}'],
    languageOptions: { 
      globals: globals.browser, 
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      } 
    },
  },
  tseslint.configs.recommended,
  pluginPrettier,
  {
    rules: {
      'unused-imports/no-unused-imports': 'warn',
    },
  },
])
