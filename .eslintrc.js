// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['tools/', 'lib/'],
  rules: {
    indent: ['warn', 2],
  },
  plugins: ['prettier-plugin-organize-imports'],
};
