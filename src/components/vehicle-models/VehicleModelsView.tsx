"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudArrowUp,
  faPen,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  BODY_TYPES,
  DEFAULT_VEHICLE_IMAGE,
  type RideCategory,
  type VehicleModelRecord,
  RIDE_CATEGORIES,
  initialVehicleModels,
} from "@/lib/vehicle-models-mock";

function categoryPillClass(category: RideCategory): string {
  switch (category) {
    case "VIP":
      return "bg-teal-800 text-white";
    case "Pika Padrão":
      return "bg-emerald-500 text-white";
    case "SUV":
      return "bg-[#6b7c3a] text-white";
    default:
      return "bg-slate-600 text-white";
  }
}

type ModalMode = "add" | "edit";

type FormState = {
  brand: string;
  model: string;
  year: string;
  bodyType: string;
  category: RideCategory | "";
  previewUrl: string | null;
  fileName: string | null;
};

const emptyForm: FormState = {
  brand: "",
  model: "",
  year: "",
  bodyType: "",
  category: "",
  previewUrl: null,
  fileName: null,
};

function AvailabilitySwitch({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelledBy: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full border border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pika-primary",
        checked ? "bg-pika-primary" : "bg-slate-300",
      )}
    >
      <span
        className={cn(
          "pointer-events-none absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ease-out",
          checked ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}

export function VehicleModelsView() {
  const [models, setModels] = useState<VehicleModelRecord[]>(initialVehicleModels);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const panelId = useId();

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, closeModal]);

  const openAdd = () => {
    setModalMode("add");
    setEditingId(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const openEdit = (m: VehicleModelRecord) => {
    setModalMode("edit");
    setEditingId(m.id);
    setForm({
      brand: m.brand,
      model: m.model,
      year: String(m.year),
      bodyType: m.bodyType,
      category: m.category,
      previewUrl: m.imageSrc,
      fileName: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    setModalOpen(true);
  };

  const onPickFile = (file: File | null) => {
    if (!file) {
      setForm((f) => ({ ...f, previewUrl: null, fileName: null }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setForm((f) => ({ ...f, previewUrl: result, fileName: file.name }));
      }
    };
    reader.readAsDataURL(file);
  };

  const submitModal = () => {
    if (!form.brand.trim() || !form.model.trim() || !form.year.trim()) return;
    if (!form.bodyType || !form.category) return;
    const yearNum = Number.parseInt(form.year, 10);
    if (!Number.isFinite(yearNum) || yearNum < 1900 || yearNum > 2100) return;

    const imageSrc = form.previewUrl ?? DEFAULT_VEHICLE_IMAGE;

    if (modalMode === "edit" && editingId) {
      setModels((list) =>
        list.map((row) =>
          row.id === editingId
            ? {
                ...row,
                brand: form.brand.trim(),
                model: form.model.trim(),
                year: yearNum,
                bodyType: form.bodyType,
                category: form.category as RideCategory,
                imageSrc,
              }
            : row,
        ),
      );
    } else {
      const id = crypto.randomUUID();
      setModels((list) => [
        {
          id,
          brand: form.brand.trim(),
          model: form.model.trim(),
          year: yearNum,
          bodyType: form.bodyType,
          status: "ativo",
          category: form.category as RideCategory,
          disponivel: true,
          imageSrc,
        },
        ...list,
      ]);
    }
    closeModal();
  };

  const setDisponivel = (id: string, disponivel: boolean) => {
    setModels((list) =>
      list.map((m) => (m.id === id ? { ...m, disponivel } : m)),
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark"
        >
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
          Adicionar Modelo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {models.map((m) => {
          const availId = `avail-${m.id}`;
          return (
            <article
              key={m.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-pika-border bg-white shadow-sm"
            >
              <div className="relative h-44 bg-slate-100">
                <span className="absolute left-3 top-3 z-10 text-xs font-medium text-pika-muted">
                  {m.bodyType}
                </span>
                <span
                  className={cn(
                    "absolute right-3 top-3 z-10 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    m.status === "ativo"
                      ? "bg-pika-success text-white"
                      : "bg-slate-200 text-pika-muted",
                  )}
                >
                  {m.status === "ativo" ? "Ativo" : "Inativo"}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element -- URLs remotas e data URLs do upload */}
                <img
                  src={m.imageSrc}
                  alt=""
                  className="mx-auto h-full w-full max-w-[220px] object-contain object-center p-3"
                />
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-pika-muted">{m.brand}</p>
                    <p className="truncate text-base font-bold text-pika-ink">
                      {m.model}
                    </p>
                    <p className="text-xs text-pika-muted">{m.year}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
                      categoryPillClass(m.category),
                    )}
                  >
                    {m.category}
                  </span>
                </div>

                <div className="mt-auto flex items-center justify-between gap-2 border-t border-pika-border pt-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <AvailabilitySwitch
                      checked={m.disponivel}
                      onChange={(v) => setDisponivel(m.id, v)}
                      labelledBy={availId}
                    />
                    <span
                      id={availId}
                      className="truncate text-xs font-medium text-pika-muted"
                    >
                      {m.disponivel ? "Disponível" : "Indisponível"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEdit(m)}
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-pika-border bg-pika-page text-pika-muted transition hover:bg-white hover:text-pika-ink"
                    aria-label="Editar modelo"
                  >
                    <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-start justify-between gap-3">
              <h2 id={titleId} className="text-lg font-bold text-pika-ink">
                {modalMode === "add"
                  ? "Adicionar Novo Modelo de Viatura"
                  : "Editar Modelo de Viatura"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-pika-border text-pika-muted transition hover:bg-pika-page"
                aria-label="Fechar"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-pika-border bg-slate-100 sm:h-36 sm:w-36">
                {form.previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- pré-visualização (URL remota ou data URL) */
                  <img
                    src={form.previewUrl}
                    alt=""
                    className="h-full w-full object-contain p-2"
                  />
                ) : (
                  <span className="text-xs text-pika-muted">Pré-visualização</span>
                )}
              </div>
              <div className="flex min-h-[8rem] flex-1 flex-col justify-center rounded-xl border border-dashed border-pika-border bg-pika-page p-4 text-center sm:text-left">
                <FontAwesomeIcon
                  icon={faCloudArrowUp}
                  className="mx-auto mb-2 h-8 w-8 text-pika-primary sm:mx-0"
                />
                <p className="text-sm font-medium text-pika-ink">Carregar imagem</p>
                <p className="mt-1 text-xs text-pika-muted">PNG ou JPG • Max. 5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 inline-flex items-center justify-center rounded-lg bg-pika-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-pika-primary-dark sm:self-start"
                >
                  Carregar
                </button>
                {form.fileName ? (
                  <p className="mt-2 truncate text-xs text-pika-muted">{form.fileName}</p>
                ) : null}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-pika-ink">Marca</span>
                <input
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                  className="w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:bg-white"
                  placeholder="Ex.: Toyota"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-pika-ink">Modelo</span>
                <input
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  className="w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:bg-white"
                  placeholder="Ex.: Corolla"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-pika-ink">Ano</span>
                <input
                  inputMode="numeric"
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                  className="w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:bg-white"
                  placeholder="2024"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-pika-ink">Tipo</span>
                <select
                  value={form.bodyType}
                  onChange={(e) => setForm((f) => ({ ...f, bodyType: e.target.value }))}
                  className="w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:bg-white"
                >
                  <option value="">Selecionar</option>
                  {BODY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm">
              <span className="mb-1.5 block font-medium text-pika-ink">
                Categoria de corrida
              </span>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as RideCategory | "",
                  }))
                }
                className="w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:bg-white"
              >
                <option value="">Selecionar</option>
                {RIDE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-pika-border bg-pika-page px-4 py-2.5 text-sm font-semibold text-pika-ink transition hover:bg-white sm:flex-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitModal}
                disabled={
                  !form.brand.trim() ||
                  !form.model.trim() ||
                  !form.year.trim() ||
                  !form.bodyType ||
                  !form.category
                }
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-pika-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {modalMode === "add" ? "Adicionar" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
