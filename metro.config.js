const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */

const config = getDefaultConfig(__dirname);

[("js", "jsx", "json", "ts", "tsx", "mjs", "wasm", "data", "json")].forEach(
  (ext) => {
    if (config.resolver.sourceExts.indexOf(ext) === -1) {
      config.resolver.sourceExts.push(ext);
    }
  }
);

["glb", "gltf", "png", "jpg", "jsmat", "hdr", "json"].forEach((ext) => {
  if (config.resolver.assetExts.indexOf(ext) === -1) {
    config.resolver.assetExts.push(ext);
  }
});

module.exports = config;
