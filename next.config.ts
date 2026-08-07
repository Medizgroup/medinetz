import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
    ],
    dangerouslyAllowSVG: true,
  },
  async rewrites() {
    return [
      // Uploads werden jetzt über die API-Route ausgeliefert (next start
      // liefert neu hinzugekommene Dateien unter public/ nicht zuverlässig
      // aus, siehe app/api/uploads/[filename]/route.ts). Dieser Rewrite hält
      // bereits gespeicherte /uploads/...-URLs aus älteren Protokollen am Leben.
      {
        source: "/uploads/:filename",
        destination: "/api/uploads/:filename",
      },
    ];
  },
};

export default nextConfig;
