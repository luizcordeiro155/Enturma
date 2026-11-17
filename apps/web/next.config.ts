import type { NextConfig } from "next";
// Enturma Stabilization / Polish validation marker.
const config: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  devIndicators: false,
  transpilePackages: ["@enturma/contracts", "@enturma/design-tokens"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value:
              "base-uri 'self'; object-src 'none'; form-action 'self'; " +
              // Only Enturma itself and the Mostra+ showcase (EXPOUNA) may frame the app.
              "frame-ancestors 'self' https://mostraplus.com.br https://*.mostraplus.com.br" +
              (process.env.NODE_ENV === "production"
                ? "; upgrade-insecure-requests"
                : ""),
          },
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
          {
            key: "Permissions-Policy",
            value:
              "camera=(self), microphone=(self), display-capture=(self), geolocation=(self)",
          },
        ],
      },
    ];
  },
};
export default config;
