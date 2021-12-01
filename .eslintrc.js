module.exports = {
  extends: ['plugin:prettier/recommended'],
  env: {
    es6: true,
  },
  parserOptions: {
    ecmaVersion: 2017,
  },
  plugins: ['prettier', 'jest'],
  rules: {
    'prettier/prettier': ['error'],
    indent: ['error', 2, { SwitchCase: 1 }],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single', { avoidEscape: true }],
    semi: ['error', 'always'],
    'spaced-comment': ['error', 'always', { exceptions: ['-', '+'] }],
  },
  settings: {},
};
