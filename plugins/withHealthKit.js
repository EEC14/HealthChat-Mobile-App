const { withEntitlementsPlist } = require("@expo/config-plugins");

module.exports = function withHealthKit(config) {
  return withEntitlementsPlist(config, (mod) => {
    mod.modResults["com.apple.developer.healthkit"] = true;
    mod.modResults["com.apple.developer.healthkit.access"] = ["health-records"];
    return mod;
  });
};