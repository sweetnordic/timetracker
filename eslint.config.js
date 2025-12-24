import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'output',
      // Logs
      'logs/**',
      '**/*.log',
      // Runtime data
      'pids/**',
      '**/*.pid',
      '**/*.seed',
      // Coverage directory
      'coverage/**',
      '.eslintcache',
      // Dependencies
      'node_modules/**',
      // OS files
      '**/.DS_Store',
      // Build outputs
      'release/app/dist/**',
      'release/build/**',
      '.erb/dll/**',
      // IDE
      '.idea/**',
      // Debug logs
      '**/npm-debug.log.*',
      // Type definitions for CSS/SASS/SCSS
      '**/*.css.d.ts',
      '**/*.sass.d.ts',
      '**/*.scss.d.ts',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
);
