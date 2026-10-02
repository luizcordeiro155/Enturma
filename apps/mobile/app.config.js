const configuration = require("./app.json");

module.exports = () => {
  const api =
    process.env.EXPO_PUBLIC_API_URL ||
    "https://enturma-flax.vercel.app/api/mobile-backend";

  if (
    process.env.EAS_BUILD_PROFILE &&
    !(
      /^https:\/\/[^/]+\/api\/v1\/?$/.test(api) ||
      api === "https://enturma-flax.vercel.app/api/mobile-backend"
    )
  ) {
    throw new Error(
      "Configure EXPO_PUBLIC_API_URL com a API HTTPS do Enturma ou use o proxy mobile oficial.",
    );
  }

  return {
    ...configuration.expo,
    extra: {
      ...(configuration.expo.extra || {}),
      apiUrl: api,
    },
  };
};
