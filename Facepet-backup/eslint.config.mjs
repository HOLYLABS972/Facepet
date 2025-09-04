import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginReact from 'eslint-plugin-react';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}'] },
  { files: ['**/*.js'], languageOptions: { sourceType: 'script' } },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  // Add your custom configurations
  {
    languageOptions: {
      parser: '@typescript-eslint/parser' // Use the TypeScript parser
    },
    plugins: {
      '@typescript-eslint': tseslint // Include the TypeScript plugin
    },
    extends: [
      'plugin:@typescript-eslint/recommended', // TypeScript-specific rules
      'eslint-config-airbnb-base', // Airbnb Base rules
      'plugin:prettier/recommended' // Prettier integration
    ]
  }
];
