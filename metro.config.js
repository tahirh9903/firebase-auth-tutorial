const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add support for CJS modules
config.resolver.sourceExts.push('cjs');

// Disable package exports to avoid dual package hazard
config.resolver.unstable_enablePackageExports = false;

// Handle Firebase ESM/CJS issue in SDK 53
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Always import the ESM version of all `@firebase/*` packages
  if (moduleName.startsWith('@firebase/')) {
    return context.resolveRequest(
      {
        ...context,
        isESMImport: true, // Mark the import method as ESM
      },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config; 