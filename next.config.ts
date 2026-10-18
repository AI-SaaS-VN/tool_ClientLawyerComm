import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (pdfjs) and mammoth resolve workers/assets at runtime; bundling
  // them breaks attachment text extraction (T15), so they stay external.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "mammoth"],
  // A parallel instance can be served under a sub-path (the Shanghai host
  // serves the pilot at / and the isolated test instance at /new). Unset
  // means root. Client-side URLs are prefixed via NEXT_PUBLIC_BASE_PATH
  // (see src/lib/api-path.ts) — keep the two variables equal at build time.
  basePath: process.env.BASE_PATH || undefined,
};

export default nextConfig;
