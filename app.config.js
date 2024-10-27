export default ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    package: "com.spell.three",
    applicationId: "com.spell.three"
  },
  expo: {
    extra: {
      eas: {
        projectId: "dcaa7171-39ab-41d8-a95c-10ed45658225"
      }
    }
  }
});
