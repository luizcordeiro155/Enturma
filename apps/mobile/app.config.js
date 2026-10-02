const configuration = require("./app.json");

module.exports = () => {
  const api = process.env.EXPO_PUBLIC_API_URL;
  if (
    process.env.EAS_BUILD_PROFILE &&
    (!api || !/^https:\/\/[^/]+\/api\/v1\/?$/.test(api))
  ) {
    throw new Error(
      "Configure EXPO_PUBLIC_API_URL com a origem HTTPS real da API e /api/v1 no ambiente EAS antes de gerar APK/AAB.",
    );
  }
  return configuration.expo;
};
