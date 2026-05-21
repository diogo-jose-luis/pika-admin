import { refToDocId } from "@/lib/firestore-ref";

export const BODY_TYPES = ["Sedan", "Luxo", "Hatch", "SUV", "Minivan", "Pickup"] as const;

export const DEFAULT_VEHICLE_IMAGE =
  "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=480&q=80";

export type ModeloViaturaDoc = {
  imagem?: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  tipo?: string;
  categoriadecorrida?: unknown;
  disponivel?: boolean;
};

export type VehicleModelRecord = {
  id: string;
  brand: string;
  model: string;
  year: number;
  bodyType: string;
  status: "ativo" | "inativo";
  categoryId: string;
  categoryName: string;
  categoryOrdem: number;
  disponivel: boolean;
  imageSrc: string;
};

export type ModeloViaturaInput = {
  marca: string;
  modelo: string;
  ano: number;
  tipo: string;
  imagem: string;
  disponivel: boolean;
  categoriaId: string;
};

export type CategoriaLookup = Map<
  string,
  { nome: string; ordem: number }
>;

const PILL_COLORS = [
  "bg-teal-800 text-white",
  "bg-emerald-500 text-white",
  "bg-[#6b7c3a] text-white",
  "bg-slate-600 text-white",
];

function num(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function categoryPillClass(ordem: number): string {
  const idx = Math.max(0, Math.min(PILL_COLORS.length - 1, ordem - 1));
  return PILL_COLORS[idx]!;
}

export function mapModeloViaturaDoc(
  id: string,
  data: ModeloViaturaDoc,
  categorias: CategoriaLookup,
): VehicleModelRecord {
  const categoryId = refToDocId(data.categoriadecorrida) ?? "";
  const cat = categorias.get(categoryId);
  const disponivel = data.disponivel !== false;

  return {
    id,
    brand: data.marca?.trim() || "—",
    model: data.modelo?.trim() || "—",
    year: num(data.ano),
    bodyType: data.tipo?.trim() || "—",
    status: disponivel ? "ativo" : "inativo",
    categoryId,
    categoryName: cat?.nome ?? "—",
    categoryOrdem: cat?.ordem ?? 1,
    disponivel,
    imageSrc: data.imagem?.trim() || DEFAULT_VEHICLE_IMAGE,
  };
}

export function sortVehicleModels(list: VehicleModelRecord[]): VehicleModelRecord[] {
  return [...list].sort((a, b) => {
    const byBrand = a.brand.localeCompare(b.brand, "pt");
    if (byBrand !== 0) return byBrand;
    return a.model.localeCompare(b.model, "pt");
  });
}

export function vehicleModelMatchesSearch(
  record: VehicleModelRecord,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystack = [
    record.brand,
    record.model,
    String(record.year),
    record.bodyType,
    record.categoryName,
    record.status,
    record.status === "ativo" ? "ativo" : "inativo",
    record.disponivel ? "disponível" : "indisponível",
    record.disponivel ? "disponivel" : "indisponivel",
  ]
    .join(" ")
    .toLowerCase();

  const terms = q.split(/\s+/).filter(Boolean);
  return terms.every((term) => haystack.includes(term));
}

export function modelToInput(record: VehicleModelRecord): ModeloViaturaInput {
  return {
    marca: record.brand,
    modelo: record.model,
    ano: record.year,
    tipo: record.bodyType,
    imagem: record.imageSrc,
    disponivel: record.disponivel,
    categoriaId: record.categoryId,
  };
}

export function buildCategoriaLookup(
  categorias: Array<{ id: string; nome: string; ordem: number }>,
): CategoriaLookup {
  return new Map(categorias.map((c) => [c.id, { nome: c.nome, ordem: c.ordem }]));
}
