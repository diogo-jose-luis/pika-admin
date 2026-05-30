import { formatKz } from "@/lib/format-kz";

export const ORDEM_OPTIONS = [1, 2, 3] as const;
export type CategoriaOrdem = (typeof ORDEM_OPTIONS)[number];

export const SIMULATION_KM = 10;
export const SIMULATION_MIN = 20;

export type CategoriaDoc = {
  nome?: string;
  base?: number;
  minima?: number;
  preco_km?: number;
  preco_min?: number;
  multiplicador?: number;
  raioDesconto?: number;
  ativo?: boolean;
  imagem?: string;
  ordem?: number;
};

export type Categoria = {
  id: string;
  nome: string;
  base: number;
  minima: number;
  preco_km: number;
  preco_min: number;
  multiplicador: number;
  raioDesconto: number;
  ativo: boolean;
  imagem: string;
  ordem: CategoriaOrdem;
};

export type CategoriaInput = {
  nome: string;
  base: number;
  minima: number;
  preco_km: number;
  preco_min: number;
  multiplicador: number;
  raioDesconto: number;
  ativo: boolean;
  imagem: string;
  ordem: CategoriaOrdem;
};

export type ComparisonRow = {
  id: string;
  nome: string;
  baseLabel: string;
  distanceLabel: string;
  timeLabel: string;
  multiplierLabel: string;
  totalLabel: string;
  highlight: boolean;
};

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeOrdem(value: unknown): CategoriaOrdem {
  const n = Math.round(num(value, 1));
  if (n === 2) return 2;
  if (n === 3) return 3;
  return 1;
}

export function mapCategoriaDoc(id: string, data: CategoriaDoc): Categoria {
  return {
    id,
    nome: data.nome?.trim() || "—",
    base: num(data.base),
    minima: num(data.minima),
    preco_km: num(data.preco_km),
    preco_min: num(data.preco_min),
    multiplicador: num(data.multiplicador, 1),
    raioDesconto: num(data.raioDesconto),
    ativo: Boolean(data.ativo),
    imagem: data.imagem?.trim() || "",
    ordem: normalizeOrdem(data.ordem),
  };
}

export function sortCategorias(list: Categoria[]): Categoria[] {
  return [...list].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt"));
}

export function calcFareEstimate(
  cat: Pick<Categoria, "base" | "minima" | "preco_km" | "preco_min" | "multiplicador">,
  km = SIMULATION_KM,
  min = SIMULATION_MIN,
): number {
  const subtotal = cat.base + cat.preco_km * km + cat.preco_min * min;
  const total = subtotal * cat.multiplicador;
  return Math.max(cat.minima, total);
}

export function buildComparisonRows(categorias: Categoria[]): ComparisonRow[] {
  const sorted = sortCategorias(categorias);
  const mid = Math.floor(sorted.length / 2);

  return sorted.map((cat, index) => {
    const distance = cat.preco_km * SIMULATION_KM;
    const time = cat.preco_min * SIMULATION_MIN;

    return {
      id: cat.id,
      nome: cat.nome,
      baseLabel: formatKz(cat.base),
      distanceLabel: formatKz(distance),
      timeLabel: formatKz(time),
      multiplierLabel: `x${cat.multiplicador.toLocaleString("pt-AO", { maximumFractionDigits: 1 })}`,
      totalLabel: formatKz(calcFareEstimate(cat)),
      highlight: sorted.length > 1 && index === mid,
    };
  });
}

export function multiplierBadge(multiplicador: number): {
  label: string;
  tone: string;
} {
  if (multiplicador > 1.05) {
    return { label: "Alta demanda", tone: "bg-red-100 text-red-800" };
  }
  if (multiplicador < 0.95) {
    return { label: "Promoção", tone: "bg-emerald-100 text-emerald-800" };
  }
  return { label: "Normal", tone: "bg-orange-100 text-orange-800" };
}

export function categoriaToInput(cat: Categoria): CategoriaInput {
  return {
    nome: cat.nome,
    base: cat.base,
    minima: cat.minima,
    preco_km: cat.preco_km,
    preco_min: cat.preco_min,
    multiplicador: cat.multiplicador,
    raioDesconto: cat.raioDesconto,
    ativo: cat.ativo,
    imagem: cat.imagem,
    ordem: cat.ordem,
  };
}

export function docFromInput(input: CategoriaInput): CategoriaDoc {
  return {
    nome: input.nome.trim(),
    base: input.base,
    minima: input.minima,
    preco_km: input.preco_km,
    preco_min: input.preco_min,
    multiplicador: input.multiplicador,
    raioDesconto: input.raioDesconto,
    ativo: input.ativo,
    imagem: input.imagem.trim(),
    ordem: input.ordem,
  };
}
