// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import jsonc from 'eslint-plugin-jsonc';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'reports/**', '.stryker-tmp/**', 'node_modules/**'],
  },

  // Config and script files (Node environment, no type information needed)
  {
    files: ['**/*.{js,ts}'],
    ignores: ['src/**'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Application source: type-aware rules
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat['recommended-latest'],
      jsxA11y.flatConfigs.recommended,
      sonarjs.configs.recommended,
    ],
    plugins: { unicorn },
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Complexity guardrails
      complexity: ['error', { max: 10 }],
      'max-depth': ['error', 3],
      'max-params': ['error', 4],
      'max-nested-callbacks': ['error', 3],

      // Type-aware strictness
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      'sonarjs/no-unused-vars': 'off', // duplicate of the TypeScript rule above
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',

      // Selected modern-JS patterns
      'unicorn/no-nested-ternary': 'error',
      'unicorn/prefer-modern-math-apis': 'error',
      'unicorn/prefer-string-slice': 'error',
      'unicorn/prefer-array-flat-map': 'error',
      'unicorn/throw-new-error': 'error',
      'unicorn/prefer-node-protocol': 'error',

      'no-console': 'warn',
      'no-debugger': 'error',
    },
  },

  // Tests: relax rules that fight common testing idioms
  {
    files: ['src/**/*.test.{ts,tsx}', 'src/__tests__/**', 'src/test/**'],
    rules: {
      complexity: 'off',
      'max-nested-callbacks': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/pseudo-random': 'off',
      'sonarjs/no-duplicate-string': 'off',
    },
  },

  // JSON
  {
    files: ['**/*.json'],
    ignores: ['tsconfig*.json', '.vscode/**'],
    extends: [jsonc.configs['flat/recommended-with-json']],
  },
  {
    files: ['tsconfig*.json', '.vscode/**/*.json'],
    extends: [jsonc.configs['flat/recommended-with-jsonc']],
  },
  {
    files: ['package.json'],
    rules: {
      'jsonc/sort-keys': [
        'error',
        {
          pathPattern: '^$',
          order: [
            'name',
            'version',
            'description',
            'keywords',
            'author',
            'license',
            'private',
            'type',
            'packageManager',
            'engines',
            'scripts',
            'lint-staged',
            'dependencies',
            'devDependencies',
            'pnpm',
          ],
        },
      ],
    },
  },

  // Keep Prettier last to disable stylistic rules that conflict with it
  eslintConfigPrettier,
);
