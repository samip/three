export default ({ config }) => ({
  ...config,
  expo: {
    scheme: 'com.spell.three',
    android: {
      package: 'com.spell.three',
      applicationId: 'com.spell.three',
    },
    ios: {
      bundleIdentifier: 'com.spell.three',
    },
    extra: {
      eas: {
        projectId: 'dcaa7171-39ab-41d8-a95c-10ed45658225',
      },
    },
    plugins: ['expo-router'],
  },
});
