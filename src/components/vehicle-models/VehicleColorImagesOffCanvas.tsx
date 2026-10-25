"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudArrowUp,
  faPen,
  faPlus,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useEffect, useRef, useState } from "react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { OffCanvas } from "@/components/ui/OffCanvas";
import { cn } from "@/lib/cn";
import type { VehicleModelRecord } from "@/lib/modelo-viatura";
import {
  VEHICLE_COLORS,
  canonicalVehicleColor,
  colorSwatch,
  colorsMatch,
  sortColorImages,
  type ViaturaCorImagemRecord,
} from "@/lib/viatura-cor-imagem";

type FormMode =
  | { type: "add" }
  | { type: "edit"; record: ViaturaCorImagemRecord };

type FormState = {
  cor: string;
  previewUrl: string | null;
  fileName: string | null;
};

const emptyForm: FormState = {
  cor: "",
  previewUrl: null,
  fileName: null,
};

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Não foi possível ler a imagem."));
    };
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
}

/** Reduz a fotografia para caber no documento do Firestore. */
async function imageFileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Selecione uma imagem PNG ou JPG.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("A imagem é demasiado grande. Escolha outra fotografia.");
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxEdge = 1280;
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Não foi possível preparar a imagem.");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    let quality = 0.82;
    let dataUrl = canvas.toDataURL("image/jpeg", quality);
    while (dataUrl.length > 850_000 && quality > 0.45) {
      quality = Math.round((quality - 0.1) * 100) / 100;
      dataUrl = canvas.toDataURL("image/jpeg", quality);
    }
    if (dataUrl.length > 900_000) {
      throw new Error("A imagem continua demasiado grande. Escolha outra fotografia.");
    }
    return dataUrl;
  } catch (err) {
    if (err instanceof Error && /demasiado grande|preparar a imagem/.test(err.message)) {
      throw err;
    }
    const dataUrl = await readFileAsDataUrl(file);
    if (dataUrl.length > 900_000) {
      throw new Error("A imagem é demasiado grande. Escolha outra fotografia.");
    }
    return dataUrl;
  }
}

function ColorSwatch({ cor, className }: { cor: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 rounded-full border border-black/15 shadow-inner",
        className,
      )}
      style={{ backgroundColor: colorSwatch(cor) }}
    />
  );
}

export function VehicleColorImagesOffCanvas({
  model,
  onClose,
}: {
  model: VehicleModelRecord | null;
  onClose: () => void;
}) {
  const [cores, setCores] = useState<ViaturaCorImagemRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<ViaturaCorImagemRecord | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modelId = model?.id ?? null;

  useEffect(() => {
    if (!modelId) return;
    let cancelled = false;
    setFormMode(null);
    setForm(emptyForm);
    setDeleteTarget(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/modelo-viaturas/${modelId}/cores`, {
          cache: "no-store",
        });
        const data = (await res.json()) as {
          cores?: ViaturaCorImagemRecord[];
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          throw new Error(data.error ?? "Não foi possível carregar as cores.");
        }
        setCores(sortColorImages(data.cores ?? []));
      } catch (err) {
        if (cancelled) return;
        setCores([]);
        setError(
          err instanceof Error ? err.message : "Não foi possível carregar as cores.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [modelId]);

  const resetForm = () => {
    setFormMode(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const closeForm = () => {
    if (saving) return;
    resetForm();
  };

  const openAdd = () => {
    setError(null);
    setFormMode({ type: "add" });
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openEdit = (record: ViaturaCorImagemRecord) => {
    setError(null);
    setFormMode({ type: "edit", record });
    setForm({
      cor: canonicalVehicleColor(record.cor) ?? "",
      previewUrl: record.imagem || null,
      fileName: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const previewUrl = await imageFileToDataUrl(file);
      setForm((current) => ({
        ...current,
        previewUrl,
        fileName: file.name,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível ler a imagem.");
    }
  };

  const editingId = formMode?.type === "edit" ? formMode.record.id : null;

  const colorTaken = (cor: string) =>
    cores.some((item) => item.id !== editingId && colorsMatch(item.cor, cor));

  const canSave = Boolean(form.cor) && Boolean(form.previewUrl) && !colorTaken(form.cor);

  const submit = async () => {
    if (!model || !formMode || !canSave || !form.previewUrl) return;
    setSaving(true);
    setError(null);
    try {
      const url =
        formMode.type === "edit"
          ? `/api/modelo-viaturas/${model.id}/cores/${formMode.record.id}`
          : `/api/modelo-viaturas/${model.id}/cores`;
      const res = await fetch(url, {
        method: formMode.type === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cor: form.cor, imagem: form.previewUrl }),
      });
      const data = (await res.json()) as {
        cor?: ViaturaCorImagemRecord;
        error?: string;
      };
      if (!res.ok || !data.cor) {
        throw new Error(data.error ?? "Não foi possível guardar a cor.");
      }
      const saved = data.cor;
      setCores((list) =>
        sortColorImages([
          ...list.filter((item) => item.id !== saved.id),
          saved,
        ]),
      );
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível guardar a cor.");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!model || !deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/modelo-viaturas/${model.id}/cores/${deleteTarget.id}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível eliminar a cor.");
      }
      const removedId = deleteTarget.id;
      setCores((list) => list.filter((item) => item.id !== removedId));
      setFormMode((mode) =>
        mode?.type === "edit" && mode.record.id === removedId ? null : mode,
      );
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível eliminar a cor.");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const busy = saving || deleting || deleteTarget !== null;
  const subtitle = model
    ? `${model.brand} ${model.model} · ${model.year}`
    : undefined;

  return (
    <>
      <OffCanvas
        open={model !== null}
        onClose={onClose}
        title="Cores e imagens"
        subtitle={subtitle}
        xl
        busy={busy}
      >
        {model ? (
          <div className="space-y-5 p-5">
            <div className="flex items-center gap-3 rounded-2xl border border-pika-border bg-pika-page p-3">
              <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={model.imageSrc}
                  alt=""
                  className="h-full w-full object-contain p-1"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-pika-ink">
                  {model.brand} {model.model}
                </p>
                <p className="truncate text-xs text-pika-muted">
                  {model.year} · {model.bodyType} · {model.categoryName}
                </p>
              </div>
            </div>

            {error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            ) : null}

            {formMode ? (
              <section className="rounded-2xl border border-pika-border bg-pika-page p-4">
                <h3 className="text-sm font-bold text-pika-ink">
                  {formMode.type === "add" ? "Nova cor" : "Editar cor"}
                </h3>

                <label className="mt-4 block text-sm">
                  <span className="mb-1.5 flex items-center gap-2 font-medium text-pika-ink">
                    {form.cor ? <ColorSwatch cor={form.cor} className="h-4 w-4" /> : null}
                    Cor
                  </span>
                  <select
                    value={form.cor}
                    disabled={saving}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, cor: e.target.value }))
                    }
                    className="w-full rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:ring-2 focus:ring-pika-primary/25 disabled:opacity-60"
                  >
                    <option value="">Selecionar cor</option>
                    {VEHICLE_COLORS.map((color) => {
                      const taken = colorTaken(color.value);
                      return (
                        <option key={color.value} value={color.value} disabled={taken}>
                          {taken ? `${color.value} (já registada)` : color.value}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <div className="flex h-28 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-pika-border bg-slate-100 sm:h-32 sm:w-40">
                    {form.previewUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={form.previewUrl}
                        alt={form.cor ? `Pré-visualização ${form.cor}` : "Pré-visualização"}
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <span className="px-3 text-center text-xs text-pika-muted">
                        Pré-visualização
                      </span>
                    )}
                  </div>
                  <div className="flex min-h-[7rem] flex-1 flex-col justify-center rounded-xl border border-dashed border-pika-border bg-pika-card p-4">
                    <FontAwesomeIcon
                      icon={faCloudArrowUp}
                      className="mb-2 h-6 w-6 text-pika-primary"
                    />
                    <p className="text-sm font-medium text-pika-ink">Imagem da viatura</p>
                    <p className="mt-1 text-xs text-pika-muted">
                      PNG ou JPG · ajustada automaticamente
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="sr-only"
                      onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 inline-flex items-center justify-center self-start rounded-lg bg-pika-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-pika-primary-dark disabled:opacity-50"
                    >
                      {form.previewUrl ? "Trocar imagem" : "Anexar imagem"}
                    </button>
                    {form.fileName ? (
                      <p className="mt-2 truncate text-xs text-pika-muted">{form.fileName}</p>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-xl border border-pika-border bg-pika-card px-4 py-2.5 text-sm font-semibold text-pika-ink transition hover:bg-pika-page disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void submit()}
                    disabled={!canSave || saving}
                    className="inline-flex items-center justify-center rounded-xl bg-pika-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? "A guardar…" : "Salvar"}
                  </button>
                </div>
              </section>
            ) : null}

            <section>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-pika-ink">
                  Mosaico por cor
                  {!loading ? (
                    <span className="ml-2 text-xs font-medium text-pika-muted">
                      {cores.length} {cores.length === 1 ? "cor" : "cores"}
                    </span>
                  ) : null}
                </h3>
                <button
                  type="button"
                  onClick={openAdd}
                  disabled={loading || saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-pika-primary px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
                  Adicionar cor
                </button>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-48 animate-pulse rounded-2xl border border-pika-border bg-pika-page"
                    />
                  ))}
                </div>
              ) : cores.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-pika-border bg-pika-page px-4 py-10 text-center text-sm text-pika-muted">
                  Este modelo ainda não tem cores. Adicione a primeira imagem.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {cores.map((item) => {
                    const active =
                      formMode?.type === "edit" && formMode.record.id === item.id;
                    return (
                      <article
                        key={item.id}
                        className={cn(
                          "overflow-hidden rounded-2xl border bg-pika-card shadow-sm",
                          active
                            ? "border-pika-primary ring-2 ring-pika-primary/30"
                            : "border-pika-border",
                        )}
                      >
                        <div className="flex h-36 items-center justify-center bg-slate-100">
                          {item.imagem ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={item.imagem}
                              alt={item.cor}
                              className="h-full w-full object-contain p-2"
                            />
                          ) : (
                            <span className="text-xs text-pika-muted">Sem imagem</span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 p-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <ColorSwatch cor={item.cor} className="h-4 w-4" />
                            <span className="truncate text-sm font-semibold text-pika-ink">
                              {item.cor}
                            </span>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(item)}
                              disabled={saving || deleting}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-pika-border bg-pika-page text-pika-muted transition hover:bg-pika-card hover:text-pika-ink disabled:opacity-50"
                              aria-label={`Editar cor ${item.cor}`}
                            >
                              <FontAwesomeIcon icon={faPen} className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(item)}
                              disabled={saving || deleting}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-pika-border bg-pika-page text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                              aria-label={`Eliminar cor ${item.cor}`}
                            >
                              <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </OffCanvas>

      <DeleteConfirmModal
        open={deleteTarget !== null}
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        title="Eliminar cor?"
        entityLabel={deleteTarget?.cor}
        description="Tem certeza de que deseja eliminar esta cor e a imagem associada? Esta ação é irreversível."
      />
    </>
  );
}
