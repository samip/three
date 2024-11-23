export default ({ config }) => ({
  ...config,
  expo: {
    android: {
      package: 'com.spell.three',
      applicationId: 'com.spell.three',
    },
    extra: {
      eas: {
        projectId: 'dcaa7171-39ab-41d8-a95c-10ed45658225',
      },
    },
    plugins: [
      'expo-router'
    ]
  },
});
