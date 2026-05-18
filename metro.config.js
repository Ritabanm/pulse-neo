const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    assetExts: ['bin', 'gguf', 'task', 'tflite'],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
