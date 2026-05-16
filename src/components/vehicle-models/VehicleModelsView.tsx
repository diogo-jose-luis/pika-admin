"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCloudArrowUp,
  faPen,
  faPlus,
  faTrash,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { cn } from "@/lib/cn";
import {
  BODY_TYPES,
  DEFAULT_VEHICLE_IMAGE,
  categoryPillClass,
  modelToInput,
  type ModeloViaturaInput,
  type VehicleModelRecord,
} from "@/lib/modelo-viatura";

type CategoriaOption = { id: string; nome: string; ordem: number };

type ModalMode = "add" | "edit";

type FormState = {
  brand: string;
  model: string;
  year: string;
  bodyType: string;
  categoryId: string;
  disponivel: boolean;
  previewUrl: string | null;
  fileName: string | null;
};

const emptyForm: FormState = {
  brand: "",
  model: "",
  year: "",
  bodyType: "",
  categoryId: "",
  disponivel: true,
  previewUrl: null,
  fileName: null,
};

function AvailabilitySwitch({
  checked,
  onChange,
  labelledBy,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelledBy: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full border border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pika-primary disabled:cursor-not-allowed disabled:opacity-50",
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

function formToInput(form: FormState): ModeloViaturaInput | null {
  if (!form.brand.trim() || !form.model.trim() || !form.year.trim()) return null;
  if (!form.bodyType || !form.categoryId) return null;
  const yearNum = Number.parseInt(form.year, 10);
  if (!Number.isFinite(yearNum) || yearNum < 1900 || yearNum > 2100) return null;

  return {
    marca: form.brand.trim(),
    modelo: form.model.trim(),
    ano: yearNum,
    tipo: form.bodyType,
    imagem: form.previewUrl ?? DEFAULT_VEHICLE_IMAGE,
    disponivel: form.disponivel,
    categoriaId: form.categoryId,
  };
}

export function VehicleModelsView() {
  const [models, setModels] = useState<VehicleModelRecord[]>([]);
  const [categorias, setCategorias] = useState<CategoriaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VehicleModelRecord | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const panelId = useId();

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/modelo-viaturas", { cache: "no-store" });
      const data = (await res.json()) as {
        models?: VehicleModelRecord[];
        categorias?: CategoriaOption[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao carregar modelos de viaturas.");
      }

      setModels(data.models ?? []);
      setCategorias(data.categorias ?? []);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Erro ao carregar modelos de viaturas.",
      );
      setModels([]);
      setCategorias([]);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const closeModal = useCallback(() => {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [saving]);

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
    setForm({
      ...emptyForm,
      categoryId: categorias[0]?.id ?? "",
    });
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
      categoryId: m.categoryId,
      disponivel: m.disponivel,
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

  const submitModal = async () => {
    const input = formToInput(form);
    if (!input) return;

    setSaving(true);
    try {
      const url =
        modalMode === "edit" && editingId
          ? `/api/modelo-viaturas/${editingId}`
          : "/api/modelo-viaturas";
      const res = await fetch(url, {
        method: modalMode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as { model?: VehicleModelRecord; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível guardar o modelo.");
      }

      closeModal();
      await loadData(true);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Não foi possível guardar o modelo.",
      );
    } finally {
      setSaving(false);
    }
  };

  const setDisponivel = async (record: VehicleModelRecord, disponivel: boolean) => {
    const input = modelToInput({ ...record, disponivel });
    try {
      const res = await fetch(`/api/modelo-viaturas/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = (await res.json()) as { model?: VehicleModelRecord; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível atualizar disponibilidade.");
      }

      if (data.model) {
        setModels((list) =>
          list.map((m) => (m.id === record.id ? data.model! : m)),
        );
      } else {
        await loadData(true);
      }
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar disponibilidade.",
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);

    try {
      const res = await fetch(`/api/modelo-viaturas/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível eliminar o modelo.");
      }

      await loadData(true);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Não foi possível eliminar o modelo.",
      );
    }
  };

  const formValid = formToInput(form) !== null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <RefreshDataButton loading={refreshing} onClick={() => void loadData(true)} />
        <button
          type="button"
          onClick={openAdd}
          disabled={loading || categorias.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
          Adicionar Modelo
        </button>
      </div>

      {loadError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
          {loadError}
        </p>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-2xl border border-pika-border bg-pika-card"
            />
          ))}
        </div>
      ) : models.length === 0 ? (
        <p className="rounded-2xl border border-pika-border bg-pika-card p-8 text-center text-sm text-pika-muted">
          Nenhum modelo de viatura registado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {models.map((m) => {
            const availId = `avail-${m.id}`;
            return (
              <article
                key={m.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-pika-border bg-pika-card shadow-sm"
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
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
                        categoryPillClass(m.categoryOrdem),
                      )}
                    >
                      {m.categoryName}
                    </span>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-pika-border pt-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <AvailabilitySwitch
                        checked={m.disponivel}
                        onChange={(v) => void setDisponivel(m, v)}
                        labelledBy={availId}
                      />
                      <span
                        id={availId}
                        className="truncate text-xs font-medium text-pika-muted"
                      >
                        {m.disponivel ? "Disponível" : "Indisponível"}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(m)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-pika-border bg-pika-page text-pika-muted transition hover:bg-pika-card hover:text-pika-ink"
                        aria-label="Editar modelo"
                      >
                        <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(m)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-pika-border bg-pika-page text-red-600 transition hover:bg-red-50"
                        aria-label="Eliminar modelo"
                      >
                        <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) closeModal();
          }}
        >
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-pika-card p-6 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
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
                disabled={saving}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-pika-border text-pika-muted transition hover:bg-pika-page disabled:opacity-50"
                aria-label="Fechar"
              >
                <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-6 flex flex-col gap-4 sm:flex-row">
              <div className="flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-pika-border bg-slate-100 sm:h-36 sm:w-36">
                {form.previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
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
                  className="w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:bg-pika-card"
                  placeholder="Ex.: Toyota"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-pika-ink">Modelo</span>
                <input
                  value={form.model}
                  onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                  className="w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:bg-pika-card"
                  placeholder="Ex.: Corolla"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-pika-ink">Ano</span>
                <input
                  inputMode="numeric"
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                  className="w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:bg-pika-card"
                  placeholder="2024"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-pika-ink">Tipo</span>
                <select
                  value={form.bodyType}
                  onChange={(e) => setForm((f) => ({ ...f, bodyType: e.target.value }))}
                  className="w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:bg-pika-card"
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
                value={form.categoryId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value }))
                }
                className="w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition focus:border-pika-primary focus:bg-pika-card"
              >
                <option value="">Selecionar</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </label>

            {modalMode === "edit" ? (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-pika-border bg-pika-page px-4 py-3">
                <span
                  id={`${titleId}-disponivel`}
                  className="text-sm font-medium text-pika-ink"
                >
                  Disponível
                </span>
                <AvailabilitySwitch
                  checked={form.disponivel}
                  onChange={(v) => setForm((f) => ({ ...f, disponivel: v }))}
                  labelledBy={`${titleId}-disponivel`}
                  disabled={saving}
                />
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-pika-border bg-pika-page px-4 py-2.5 text-sm font-semibold text-pika-ink transition hover:bg-pika-card disabled:opacity-50 sm:flex-none"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void submitModal()}
                disabled={!formValid || saving}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-pika-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
              >
                {saving
                  ? "A guardar…"
                  : modalMode === "add"
                    ? "Adicionar"
                    : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <DeleteConfirmModal
        open={deleteTarget !== null}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
        title="Eliminar modelo de viatura?"
        description={
          deleteTarget
            ? `Tem certeza de que deseja eliminar ${deleteTarget.brand} ${deleteTarget.model}? Esta ação é irreversível.`
            : undefined
        }
      />
    </div>
  );
}