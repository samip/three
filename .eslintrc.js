// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: ['expo', 'prettier'],
  ignorePatterns: ['tools/', 'lib/'],
  rules: {
    indent: ['warn', 2, { SwitchCase: 1 }],
  },
};
