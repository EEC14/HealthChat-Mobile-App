const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withGoogleFit(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Add the necessary permissions
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    // Add Google Fit permissions
    androidManifest.manifest['uses-permission'].push({
      $: {
        "android:name": "android.permission.ACTIVITY_RECOGNITION"
      }
    });
    
    androidManifest.manifest['uses-permission'].push({
      $: {
        "android:name": "com.google.android.gms.permission.ACTIVITY_RECOGNITION"
      }
    });

    return config;
  });
};