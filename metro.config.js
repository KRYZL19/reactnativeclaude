const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
 
const config = getDefaultConfig(__dirname);

// Ensure TypeScript files from @expo packages are transpiled
// This is needed because Metro doesn't transpile node_modules by default
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Ensure @expo packages are not blocked and TypeScript files are recognized
config.resolver = {
  ...config.resolver,
  sourceExts: [...(config.resolver?.sourceExts || []), 'ts', 'tsx'],
  unstable_enablePackageExports: true,
};
 
module.exports = withNativeWind(config, { input: './app/globals.css' })