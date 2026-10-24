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
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value:
              "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'" +
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
