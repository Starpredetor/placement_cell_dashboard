import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Pre-rewrite pages and the API surface still carry `any` and effect-based
    // data fetching. Linting them strictly now would mean fixing code that is
    // about to be replaced; each phase removes its files from this list as it
    // rewrites them. Mirrors the backend's ruff per-file-ignores.
    // See docs/REWRITE_PLAN.md §7.
    files: [
      'src/pages/**/*.tsx',
      'src/context/**/*.tsx',
      'src/services/api.ts',
      'src/lib/legacyQuery.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-hooks/exhaustive-deps': 'off',
      // Same deferral as noUnusedLocals in tsconfig.app.json — these mark dead
      // code and unfinished wiring in pages that later phases rebuild.
      '@typescript-eslint/no-unused-vars': 'off',
      // These pages export helpers alongside the component, which breaks fast
      // refresh. Resolved when each is split into feature modules.
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
  },
);
