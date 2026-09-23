import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  /** pdfkit lê ficheiros .afm em node_modules/pdfkit/js/data — não pode ser bundled. */
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/relatorios/export": ["./node_modules/pdfkit/js/data/**/*"],
  },
  ...(isStaticExport
    ? {
        output: "export" as const,
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
