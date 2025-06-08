/**
 * Metro Configuration for CleanSpot Mobile
 * 
 * This configuration extends Expo's default Metro setup with:
 * - Support for CommonJS (.cjs) files
 * - Disabled package exports for compatibility with older packages
 * - Enhanced asset handling
 */

const { getDefaultConfig } = require('expo/metro-config');

// Get the default Expo Metro configuration
const config = getDefaultConfig(__dirname);

// ===== RESOLVER CONFIGURATION =====

// Add support for .cjs files (CommonJS modules)
// This is needed for some Node.js packages that use .cjs extension
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

// Add support for .mjs files (ES modules)
if (!config.resolver.sourceExts.includes('mjs')) {
  config.resolver.sourceExts.push('mjs');
}

// Disable package.json "exports" field resolution
// This is a workaround for compatibility issues with some packages
config.resolver.unstable_enablePackageExports = false;

// ===== TRANSFORMER CONFIGURATION =====

// Environment-specific transformer settings
if (process.env.NODE_ENV === 'development') {
  // Development optimizations for better debugging
  config.transformer.minifierConfig = {
    keep_fnames: true, // Keep function names for better stack traces
    mangle: {
      keep_fnames: true,
    },
  };
}

// ===== LOGGING =====

// Log configuration details in development
if (process.env.NODE_ENV === 'development') {
  console.log('📦 Metro Config Loaded:');
  console.log(`   - Source Extensions: ${config.resolver.sourceExts.join(', ')}`);
  console.log(`   - Asset Extensions: ${config.resolver.assetExts.length} types`);
  console.log(`   - Package Exports: ${config.resolver.unstable_enablePackageExports ? 'Enabled' : 'Disabled'}`);
}

module.exports = config;
