import { refToDocId } from "@/lib/firestore-ref";

/** Cores fechadas para a viatura não ser registada com grafias diferentes. */
export const VEHICLE_COLORS = [
  { value: "Branca", hex: "#f4f4f5" },
  { value: "Preta", hex: "#171717" },
  { value: "Cinza", hex: "#9ca3af" },
  { value: "Prateada", hex: "#d1d5db" },
  { value: "Grafite", hex: "#4b5563" },
  { value: "Vermelha", hex: "#dc2626" },
  { value: "Bordô", hex: "#7f1d1d" },
  { value: "Vinho", hex: "#881337" },
  { value: "Laranja", hex: "#ea580c" },
  { value: "Amarela", hex: "#eab308" },
  { value: "Dourada", hex: "#ca8a04" },
  { value: "Verde", hex: "#16a34a" },
  { value: "Verde-escura", hex: "#14532d" },
  { value: "Azul", hex: "#2563eb" },
  { value: "Azul-marinho", hex: "#1e3a8a" },
  { value: "Castanha", hex: "#78350f" },
  { value: "Bege", hex: "#d6c4a8" },
  { value: "Creme", hex: "#f5f0e1" },
  { value: "Champanhe", hex: "#e6d3b3" },
  { value: "Cobre", hex: "#b45309" },
  { value: "Roxa", hex: "#7c3aed" },
  { value: "Rosa", hex: "#ec4899" },
] as const;

export type VehicleColorName = (typeof VEHICLE_COLORS)[number]["value"];

export type ViaturaCorImagemDoc = {
  cor?: string;
  imagem?: string;
  modelo_viatura?: unknown;
};

export type ViaturaCorImagemRecord = {
  id: string;
  cor: string;
  imagem: string;
  modeloId: string;
};

export type ViaturaCorImagemInput = {
  cor: VehicleColorName;
  imagem: string;
};

const MAX_IMAGE_CHARS = 900_000;

const COLOR_ORDER = new Map(
  VEHICLE_COLORS.map((color, index) => [color.value.toLowerCase(), index]),
);

export function colorSwatch(cor: string): string {
  const found = VEHICLE_COLORS.find(
    (color) => color.value.toLowerCase() === cor.trim().toLowerCase(),
  );
  return found?.hex ?? "#94a3b8";
}

export function canonicalVehicleColor(value: string): VehicleColorName | null {
  const found = VEHICLE_COLORS.find(
    (color) => color.value.toLowerCase() === value.trim().toLowerCase(),
  );
  return found?.value ?? null;
}

export function parseCorImagemInput(
  body: unknown,
): { ok: true; value: ViaturaCorImagemInput } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Dados inválidos." };
  }

  const raw = body as { cor?: unknown; imagem?: unknown };
  const cor =
    typeof raw.cor === "string" ? canonicalVehicleColor(raw.cor) : null;
  const imagem = typeof raw.imagem === "string" ? raw.imagem.trim() : "";

  if (!cor) {
    return { ok: false, error: "Selecione uma cor da lista." };
  }

  if (!imagem) {
    return { ok: false, error: "Anexe a imagem da viatura nesta cor." };
  }

  const isDataImage = imagem.startsWith("data:image/");
  const isRemote = /^https?:\/\//i.test(imagem);
  if (!isDataImage && !isRemote) {
    return { ok: false, error: "A imagem não é válida." };
  }

  if (imagem.length > MAX_IMAGE_CHARS) {
    return {
      ok: false,
      error: "A imagem é demasiado grande. Escolha uma fotografia mais leve.",
    };
  }

  return { ok: true, value: { cor, imagem } };
}

export function mapViaturaCorImagemDoc(
  id: string,
  data: ViaturaCorImagemDoc,
): ViaturaCorImagemRecord {
  const raw = data.cor?.trim() || "—";
  return {
    id,
    cor: canonicalVehicleColor(raw) ?? raw,
    imagem: data.imagem?.trim() || "",
    modeloId: refToDocId(data.modelo_viatura) ?? "",
  };
}

export function sortColorImages(
  list: ViaturaCorImagemRecord[],
): ViaturaCorImagemRecord[] {
  return [...list].sort((a, b) => {
    const ia = COLOR_ORDER.get(a.cor.toLowerCase()) ?? 999;
    const ib = COLOR_ORDER.get(b.cor.toLowerCase()) ?? 999;
    if (ia !== ib) return ia - ib;
    return a.cor.localeCompare(b.cor, "pt");
  });
}

export function colorsMatch(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}
