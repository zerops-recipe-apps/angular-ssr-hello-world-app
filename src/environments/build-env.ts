// Default values — overwritten by scripts/generate-build-env.js in buildCommands.
// These placeholders are used when running in development without running
// the generate script first. The build pipeline always overwrites this file.
export const BUILD_ENV = {
  version: 'dev',
  buildTime: new Date().toISOString(),
};
