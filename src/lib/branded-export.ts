import fs from "node:fs";
import path from "node:path";

export const PIKA_ORANGE = "F96100";
export const PIKA_INK = "2D3436";
export const PIKA_MUTED = "636E72";
export const PIKA_LINE = "E6DFD8";
export const PIKA_ZEBRA = "FFF6F0";
export const PIKA_CREAM = "FFF8F4";

export type BrandedTableDocument = {
  title: string;
  exportedBy: string;
  columns: string[];
  rows: string[][];
  generatedAt: string;
};

export function logoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "public", "logo.png"),
    path.join(process.cwd(), "public", "logo_pika.png"),
    path.join(process.cwd(), "public", "pika.png"),
  ];
  return candidates.find((file) => fs.existsSync(file)) ?? null;
}

/** Fontes standard PDF (WinAnsi). */
export function pdfSafeText(value: string): string {
  return value
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, "");
}

export function clipText(value: string, max: number): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}
