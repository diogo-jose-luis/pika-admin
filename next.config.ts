import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** pdfkit lê ficheiros .afm em node_modules/pdfkit/js/data — não pode ser bundled. */
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/api/relatorios/export": ["./node_modules/pdfkit/js/data/**/*"],
  },
};

export default nextConfig;
