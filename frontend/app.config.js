const config = require('./app.json');

const facebookClientToken = process.env.EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN;
config.expo.plugins = config.expo.plugins.map((plugin) => {
  if (!Array.isArray(plugin) || plugin[0] !== 'react-native-fbsdk-next') return plugin;
  const [name, options] = plugin;
  return [name, { ...options, ...(facebookClientToken ? { clientToken: facebookClientToken } : {}) }];
});

module.exports = config;
