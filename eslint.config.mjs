import angularPlugin from '@angular-eslint/eslint-plugin';
import angularTemplatePlugin from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
import eslint from '@eslint/js';
import nxPlugin from '@nx/eslint-plugin';
import rxjsPlugin from '@rxlint/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';
import noSecretsPlugin from 'eslint-plugin-no-secrets';
import securityPlugin from 'eslint-plugin-security';
import unusedImportsPlugin from 'eslint-plugin-unused-imports';
import tseslint from 'typescript-eslint';

const angularRestrictedSyntaxRules = [
  {
    selector: "PropertyDefinition[accessibility='private']",
    message: 'Use # private fields instead of the private keyword.',
  },
  {
    selector: "MethodDefinition[accessibility='private']",
    message: 'Use # private methods instead of the private keyword.',
  },
  {
    selector: "TSParameterProperty[accessibility='private']",
    message: 'Use # private fields instead of private constructor parameters.',
  },
  {
    selector: "ClassDeclaration:has(Decorator[expression.callee.name='Component']) MethodDefinition[kind='constructor'] > FunctionExpression[params.length>0]",
    message: 'Use inject() instead of constructor injection.',
  },
  {
    selector: "ClassDeclaration:has(Decorator[expression.callee.name='Directive']) MethodDefinition[kind='constructor'] > FunctionExpression[params.length>0]",
    message: 'Use inject() instead of constructor injection.',
  },
  {
    selector: "ClassDeclaration:has(Decorator[expression.callee.name='Pipe']) MethodDefinition[kind='constructor'] > FunctionExpression[params.length>0]",
    message: 'Use inject() instead of constructor injection.',
  },
  {
    selector: "ClassDeclaration:has(Decorator[expression.callee.name='Injectable']) MethodDefinition[kind='constructor'] > FunctionExpression[params.length>0]",
    message: 'Use inject() instead of constructor injection.',
  },
  {
    selector: "Property[key.name='changeDetection'][value.type='MemberExpression'][value.object.name='ChangeDetectionStrategy'][value.property.name='OnPush']",
    message: 'Do not use OnPush change detection; app is zoneless.',
  },
];

const expensesShellImportMessage = 'The app must import @wisave/expenses/shell instead of individual expenses plugin slices.';

export default tseslint.config(
  {
    files: ['**/*.ts'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended, ...tseslint.configs.stylistic, eslintConfigPrettier],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
      },
    },
    plugins: {
      '@angular-eslint': angularPlugin,
      '@nx': nxPlugin,
      '@rxlint': rxjsPlugin,
      'unused-imports': unusedImportsPlugin,
      security: securityPlugin,
      'no-secrets': noSecretsPlugin,
    },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          depConstraints: [
            {
              sourceTag: 'scope:app',
              onlyDependOnLibsWithTags: ['scope:auth', 'scope:expenses', 'scope:incomes', 'scope:platform', 'scope:settings', 'scope:stock'],
            },
            { sourceTag: 'scope:auth', onlyDependOnLibsWithTags: ['scope:auth', 'scope:platform', 'scope:shared'] },
            { sourceTag: 'scope:expenses', onlyDependOnLibsWithTags: ['scope:expenses', 'scope:platform', 'scope:shared'] },
            { sourceTag: 'scope:incomes', onlyDependOnLibsWithTags: ['scope:incomes', 'scope:platform', 'scope:shared'] },
            { sourceTag: 'scope:platform', onlyDependOnLibsWithTags: ['scope:platform', 'scope:shared'] },
            { sourceTag: 'scope:settings', onlyDependOnLibsWithTags: ['scope:settings', 'scope:platform', 'scope:shared'] },
            { sourceTag: 'scope:shared', onlyDependOnLibsWithTags: ['scope:shared'] },
            { sourceTag: 'scope:stock', onlyDependOnLibsWithTags: ['scope:stock', 'scope:platform', 'scope:shared'] },
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['type:shell', 'type:layout', 'type:feature', 'type:auth', 'type:signalr', 'type:util'],
            },
            { sourceTag: 'type:layout', onlyDependOnLibsWithTags: ['type:ui', 'type:auth', 'type:util', 'type:model'] },
            {
              sourceTag: 'type:shell',
              onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:auth', 'type:signalr', 'type:util', 'type:model'],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['type:ui', 'type:data-access', 'type:auth', 'type:signalr', 'type:util', 'type:model'],
            },
            { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:auth', 'type:signalr', 'type:util', 'type:model'] },
            { sourceTag: 'type:auth', onlyDependOnLibsWithTags: ['type:util', 'type:model'] },
            { sourceTag: 'type:signalr', onlyDependOnLibsWithTags: ['type:auth', 'type:util', 'type:model'] },
            { sourceTag: 'type:ui', onlyDependOnLibsWithTags: ['type:util', 'type:model'] },
            { sourceTag: 'type:util', onlyDependOnLibsWithTags: ['type:model'] },
            { sourceTag: 'type:model', onlyDependOnLibsWithTags: ['type:model'] },
          ],
        },
      ],

      // RxJS rules
      '@rxlint/no-async-subscribe': 'error',
      '@rxlint/no-ignored-observable': 'warn',
      '@rxlint/no-nested-subscribe': 'error',
      '@rxlint/no-unbound-methods': 'warn',
      '@rxlint/throw-error': 'error',

      // Angular-specific rules
      '@angular-eslint/component-class-suffix': 'error',
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/directive-class-suffix': 'error',
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/no-empty-lifecycle-method': 'warn',
      '@angular-eslint/no-input-rename': 'error',
      '@angular-eslint/no-output-native': 'error',
      '@angular-eslint/no-output-rename': 'error',
      '@angular-eslint/use-lifecycle-interface': 'error',
      '@angular-eslint/prefer-standalone': 'error',

      // TypeScript rules
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'off', // Using unused-imports plugin instead
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: false }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'inline-type-imports' }],

      // Enforce # private fields over private keyword
      'no-restricted-syntax': ['error', ...angularRestrictedSyntaxRules],

      // Disallow importing ChangeDetectionStrategy (OnPush is not used)
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/core',
              importNames: ['Input', 'Output', 'EventEmitter'],
              message: 'Use signal inputs/outputs (input(), output()) instead of @Input/@Output/EventEmitter.',
            },
            {
              name: '@angular/core',
              importNames: ['ChangeDetectionStrategy'],
              message: 'Do not import ChangeDetectionStrategy; OnPush is not used in this app.',
            },
            {
              name: '@angular/core',
              importNames: ['ChangeDetectorRef', 'NgZone'],
              message: 'Do not import ChangeDetectorRef or NgZone; app is zoneless.',
            },
          ],
        },
      ],

      // Warn on BehaviorSubject usage (prefer Signal Store or signals)
      '@typescript-eslint/no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: 'rxjs',
              importNames: ['BehaviorSubject'],
              message: 'Avoid BehaviorSubject for state; prefer Signal Store or signals.',
            },
          ],
        },
      ],

      // Enforce class member ordering for Angular components
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: {
            memberTypes: [
              // Static
              'static-field',
              'static-method',

              // Decorated fields (@ViewChild, @HostListener, etc.)
              'decorated-field',

              // Injected dependencies (#store = inject(...))
              '#private-instance-field',

              // Signal inputs/outputs, public fields, computed signals
              'public-instance-field',

              // Constructor
              'constructor',

              // Lifecycle hooks + public methods
              'public-instance-method',

              // Private methods
              '#private-instance-method',
            ],
          },
        },
      ],

      // Unused imports (auto-fixable)
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // Security rules
      'security/detect-object-injection': 'off', // Too many false positives in frontend code
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-possible-timing-attacks': 'warn',

      // No secrets (detect hardcoded secrets)
      'no-secrets/no-secrets': ['error', { tolerance: 4.5 }],
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'no-secrets/no-secrets': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-unsafe-regex': 'off',
      'security/detect-eval-with-expression': 'off',
      'no-restricted-syntax': 'off',
    },
  },
  {
    files: ['apps/wisave-ui/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@angular/core',
              importNames: ['Input', 'Output', 'EventEmitter'],
              message: 'Use signal inputs/outputs (input(), output()) instead of @Input/@Output/EventEmitter.',
            },
            {
              name: '@angular/core',
              importNames: ['ChangeDetectionStrategy'],
              message: 'Do not import ChangeDetectionStrategy; OnPush is not used in this app.',
            },
            {
              name: '@angular/core',
              importNames: ['ChangeDetectorRef', 'NgZone'],
              message: 'Do not import ChangeDetectorRef or NgZone; app is zoneless.',
            },
          ],
          patterns: [
            {
              group: [
                '@wisave/expenses/list',
                '@wisave/expenses/budget',
                '@wisave/expenses/accounts',
                '@wisave/expenses/plugins/list',
                '@wisave/expenses/plugins/budget',
                '@wisave/expenses/plugins/accounts',
              ],
              message: expensesShellImportMessage,
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        ...angularRestrictedSyntaxRules,
        {
          selector: 'ImportExpression[source.value=/^@wisave\\/expenses\\/(plugins\\/)?(list|budget|accounts)$/]',
          message: expensesShellImportMessage,
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    plugins: {
      '@angular-eslint/template': angularTemplatePlugin,
    },
    languageOptions: {
      parser: angularTemplateParser,
    },
    rules: {
      // Template rules from recommended config
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/eqeqeq': 'error',
      '@angular-eslint/template/no-negated-async': 'error',
      '@angular-eslint/template/prefer-self-closing-tags': 'warn',

      // Accessibility rules
      '@angular-eslint/template/alt-text': 'warn',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/label-has-associated-control': 'warn',
      '@angular-eslint/template/no-autofocus': 'warn',
      '@angular-eslint/template/no-distracting-elements': 'error',
      '@angular-eslint/template/role-has-required-aria': 'warn',
      '@angular-eslint/template/table-scope': 'warn',
      '@angular-eslint/template/valid-aria': 'warn',
    },
  },
  {
    ignores: ['dist/', '.angular/', 'node_modules/', '.yarn/', '.pnp.*', 'coverage/'],
  },
);
