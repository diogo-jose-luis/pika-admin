export function formatKz(amount: number) {
  const s = amount.toLocaleString("pt-AO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `Kz ${s}`;
}

export function parseKzInput(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const normalized = trimmed
    .replace(/\s/g, "")
    .replace(/kz/gi, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number.parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}
