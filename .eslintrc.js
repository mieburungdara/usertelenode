module.exports = {
  extends: ['standard'],
  plugins: ['jsdoc', 'boundaries'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  rules: {
    // JSDoc rules untuk typedef dan dokumentasi
    'jsdoc/require-description': 'error',
    'jsdoc/require-jsdoc': ['error', {
      require: {
        FunctionDeclaration: true,
        MethodDefinition: true,
        ClassDeclaration: true
      },
      contexts: [
        'Property',
        'MethodDefinition[key.name!=constructor]'
      ]
    }],
    'jsdoc/require-param': 'error',
    'jsdoc/require-param-description': 'error',
    'jsdoc/require-returns': 'error',
    'jsdoc/require-returns-description': 'error',
    'jsdoc/valid-types': 'error',
    'jsdoc/check-tag-names': 'error',

    // Syntax prevention rules
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',

    // Code quality
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'comma-dangle': ['error', 'always-multiline'],

    // Boundaries enforcement - disabled sementara untuk fokus JSDoc
    // 'boundaries/no-unknown': 'error',
    // 'boundaries/no-unknown-files': 'error',
    // 'boundaries/element-types': 'error'
  },
  settings: {
    jsdoc: {
      mode: 'typescript'
    },
    boundaries: {
      default: 'shared',
      elements: [
        {
          type: 'presentation',
          pattern: 'src/presentation/**/*'
        },
        {
          type: 'application',
          pattern: 'src/application/**/*'
        },
        {
          type: 'domain',
          pattern: 'src/domain/**/*'
        },
        {
          type: 'infrastructure',
          pattern: 'src/infrastructure/**/*'
        },
        {
          type: 'shared',
          pattern: 'src/shared/**/*'
        }
      ],
      rules: [
        {
          from: 'presentation',
          allow: ['application', 'shared']
        },
        {
          from: 'application',
          allow: ['domain', 'infrastructure', 'shared']
        },
        {
          from: 'domain',
          allow: ['domain', 'shared']
        },
        {
          from: 'infrastructure',
          allow: ['domain', 'infrastructure', 'shared']
        },
        {
          from: 'shared',
          allow: ['shared']
        }
      ]
    }
  }
};