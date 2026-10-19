import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `cacheComponents`/`partialPrefetching` (experimentales) se desactivan: la app
  // es intensamente dinámica (datos por usuario, sesión) y usa renderizado
  // dinámico convencional con `export const dynamic`. Ver docs/DECISIONS.md DEC-011.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
