import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse (pdfjs) and mammoth resolve workers/assets at runtime; bundling
  // them breaks attachment text extraction (T15), so they stay external.
  serverExternalPackages: ["pdf-parse", "pdfjs-dist", "mammoth"],
};

export default nextConfig;
