// metro.config.js
// Config mínima estable para RN 0.69: usa valores por defecto y inlineRequires
const { getDefaultConfig } = require('metro-config');

module.exports = (async () => {
  const {
    resolver: { sourceExts, assetExts },
  } = await getDefaultConfig();

  return {
    transformer: {
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    resolver: {
      assetExts,  // PNG/JPG ya vienen incluidos por defecto
      sourceExts,
    },
  };
})();
