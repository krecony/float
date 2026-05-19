import type { NextConfig } from "next";
import path from "path";

const clockShim = path.resolve(process.cwd(), "src/lib/threeClockShim.ts");

/** Set in CI for GitHub Pages (e.g. /slop for krecony.github.io/slop) */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  ...(basePath
    ? { basePath, assetPrefix: `${basePath}/` }
    : {}),
  turbopack: {
    resolveAlias: {
      "three/src/core/Clock.js": clockShim,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "three/src/core/Clock.js": clockShim,
    };
    return config;
  },
};

export default nextConfig;
