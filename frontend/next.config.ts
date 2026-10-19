import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Logo's (max 2 MB) gaan via een Server Action naar de backend; ruimte voor formulier-overhead
    serverActions: { bodySizeLimit: "3mb" },
  },
  turbopack: {
    // Tailwind CSS v4 via de Turbopack-loader
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
    // Koppelt next-intl aan onze taalconfiguratie. Dit doet normaal `next-intl/plugin`,
    // maar die laadt een native SWC-module die op sommige Windows-machines niet start.
    resolveAlias: {
      "next-intl/config": "./src/i18n/request.ts",
    },
  },
};

export default nextConfig;
