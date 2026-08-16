import type { NextConfig } from "next";

/** Custom domain (ssi.sofacode.dev) is served at site root — no basePath. */
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  reactCompiler: true,
};

export default nextConfig;
