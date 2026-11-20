const {
  withAndroidManifest,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");
const networkConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">127.0.0.1</domain>
    <domain includeSubdomains="false">localhost</domain>
  </domain-config>
</network-security-config>
`;
module.exports = function withLocalLibrary(config) {
  config = withAndroidManifest(config, (mod) => {
    mod.modResults.manifest.application[0].$["android:networkSecurityConfig"] =
      "@xml/unihub_network_security";
    return mod;
  });
  return withDangerousMod(config, [
    "android",
    async (mod) => {
      const directory = path.join(
        mod.modRequest.platformProjectRoot,
        "app/src/main/res/xml",
      );
      fs.mkdirSync(directory, { recursive: true });
      fs.writeFileSync(
        path.join(directory, "unihub_network_security.xml"),
        networkConfig,
      );
      return mod;
    },
  ]);
};
