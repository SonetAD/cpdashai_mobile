const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = ({ config }) => {
  return withAndroidManifest(config, (modConfig) => {
    const androidManifest = modConfig.modResults;
    const application = androidManifest.manifest.application[0];

    // Add usesCleartextTraffic="true" to the application tag to allow HTTP traffic
    application.$['android:usesCleartextTraffic'] = 'true';

    return modConfig;
  });
};
