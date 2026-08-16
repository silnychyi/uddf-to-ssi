import type { NextConfig } from "next";

/** Project-site base path on GitHub Pages (`/repo`). Empty for local/dev. */
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const basePath =
  process.env.BASE_PATH?.replace(/\/$/, "") ||
  (process.env.GITHUB_ACTIONS === "true" && repo ? `/${repo}` : "");

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  reactCompiler: true,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(basePath
    ? {
        basePath,
        assetPrefix: `${basePath}/`,
      }
    : {}),
};

export default nextConfig;
