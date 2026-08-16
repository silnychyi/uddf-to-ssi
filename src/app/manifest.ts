import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/paths";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UDDF to SSI QR",
    short_name: "SSI QR",
    description:
      "Convert Shearwater and other UDDF dive exports into MySSI QR codes.",
    start_url: withBasePath("/"),
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#e22118",
    lang: "en",
    icons: [
      {
        src: withBasePath("/favicon.svg"),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: withBasePath("/icon"),
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBasePath("/apple-icon"),
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
