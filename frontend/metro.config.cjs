// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

// Keep CJS support and ensure Metro respects package "exports" (needed for
// packages like @tanstack/react-query to pick the native entry instead of web).
config.resolver.sourceExts.push("cjs");
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
