// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ['expo', 'prettier'],
  ignorePatterns: ['tools/', 'lib/'],
  rules: {
    indent: ['warn', 2, { SwitchCase: 1 }],
    'react/no-unknown-property': 'off',
    "no-unused-vars": "off", // broken with react-fiber, disabled for now
    "@typescript-eslint/no-unused-vars": [
      "warn", // or "error"
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ]
  },
};