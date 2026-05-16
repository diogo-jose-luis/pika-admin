"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFloppyDisk, faPen, faTrash } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatKz } from "@/lib/format-kz";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import {
  ORDEM_OPTIONS,
  SIMULATION_KM,
  SIMULATION_MIN,
  type Categoria,
  type CategoriaInput,
  buildComparisonRows,
  categoriaToInput,
  multiplierBadge,
  sortCategorias,
} from "@/lib/categorias";
import { CategoryModal } from "./CategoryModal";

function SettingsSwitch({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelledBy?: string;
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

function inputClass(extra?: string) {
  return cn(
    "mt-1.5 w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition placeholder:text-pika-muted/70 focus:border-pika-primary focus:bg-pika-card focus:ring-2 focus:ring-pika-primary/20",
    extra,
  );
}

function WhiteCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm",
        className,
      )}
    >
      {children}
    </section>
  );
}

function mergeDraft(cat: Categoria, draft: CategoriaInput | undefined): Categoria {
  if (!draft) return cat;
  return {
    ...cat,
    ...draft,
  };
}

export function PricesCategoriesTab() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [drafts, setDrafts] = useState<Record<string, CategoriaInput>>({});
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalCategory, setModalCategory] = useState<Categoria | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  const fetchCategorias = useCallback(async () => {
    setFetchLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/categorias");
      const data = (await res.json()) as { categorias?: Categoria[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível carregar as categorias.");
      }
      const list = sortCategorias(data.categorias ?? []);
      setCategorias(list);
      const nextDrafts: Record<string, CategoriaInput> = {};
      for (const c of list) {
        nextDrafts[c.id] = categoriaToInput(c);
      }
      setDrafts(nextDrafts);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar categorias.";
      setError(msg);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCategorias();
  }, [fetchCategorias]);

  const sortedCards = useMemo(() => {
    const merged = categorias.map((c) => mergeDraft(c, drafts[c.id]));
    return sortCategorias(merged);
  }, [categorias, drafts]);

  const comparisonRows = useMemo(() => buildComparisonRows(sortedCards), [sortedCards]);

  const handleRefresh = useCallback(() => {
    void fetchCategorias();
  }, [fetchCategorias]);

  const openCreateModal = useCallback(() => {
    setModalMode("create");
    setModalCategory(null);
    setModalOpen(true);
  }, []);

  const openEditModal = useCallback((cat: Categoria) => {
    setModalMode("edit");
    setModalCategory(mergeDraft(cat, drafts[cat.id]));
    setModalOpen(true);
  }, [drafts]);

  const closeModal = useCallback(() => {
    if (modalSaving) return;
    setModalOpen(false);
    setModalCategory(null);
  }, [modalSaving]);

  const patchDraft = useCallback((id: string, patch: Partial<CategoriaInput>) => {
    setDrafts((prev) => {
      const base = prev[id];
      if (!base) return prev;
      return { ...prev, [id]: { ...base, ...patch } };
    });
  }, []);

  const saveInline = useCallback(
    async (id: string) => {
      const body = drafts[id];
      if (!body) return;
      setSavingId(id);
      setError(null);
      try {
        const res = await fetch(`/api/categorias/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as { categoria?: Categoria; error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Não foi possível guardar.");
        }
        const updated = data.categoria;
        if (!updated) throw new Error("Resposta inválida do servidor.");
        setCategorias((prev) => sortCategorias(prev.map((c) => (c.id === id ? updated : c))));
        setDrafts((d) => ({ ...d, [id]: categoriaToInput(updated) }));
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao guardar.";
        setError(msg);
      } finally {
        setSavingId(null);
      }
    },
    [drafts],
  );

  const submitModal = useCallback(
    async (input: CategoriaInput) => {
      setModalSaving(true);
      setError(null);
      try {
        if (modalMode === "create") {
          const res = await fetch("/api/categorias", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = (await res.json()) as { categoria?: Categoria; error?: string };
          if (!res.ok) {
            throw new Error(data.error || "Não foi possível criar a categoria.");
          }
          const created = data.categoria;
          if (!created) throw new Error("Resposta inválida do servidor.");
          setCategorias((prev) => sortCategorias([...prev, created]));
          setDrafts((d) => ({ ...d, [created.id]: categoriaToInput(created) }));
          setModalOpen(false);
          setModalCategory(null);
          return;
        }

        if (!modalCategory) return;
        const res = await fetch(`/api/categorias/${modalCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = (await res.json()) as { categoria?: Categoria; error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Não foi possível atualizar a categoria.");
        }
        const updated = data.categoria;
        if (!updated) throw new Error("Resposta inválida do servidor.");
        setCategorias((prev) =>
          sortCategorias(prev.map((c) => (c.id === updated.id ? updated : c))),
        );
        setDrafts((d) => ({ ...d, [updated.id]: categoriaToInput(updated) }));
        setModalOpen(false);
        setModalCategory(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao guardar.";
        setError(msg);
      } finally {
        setModalSaving(false);
      }
    },
    [modalCategory, modalMode],
  );

  const confirmDelete = useCallback(async () => {
    if (deleteBusy) return;
    const id = deletingId;
    if (!id) return;
    setDeleteBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível eliminar a categoria.");
      }
      setCategorias((prev) => prev.filter((c) => c.id !== id));
      setDrafts((d) => {
        const next = { ...d };
        delete next[id];
        return next;
      });
      setDeletingId(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao eliminar.";
      setError(msg);
    } finally {
      setDeleteBusy(false);
    }
  }, [deletingId, deleteBusy]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-pika-ink md:text-xl">Preços e Categorias</h2>
          <p className="mt-1 max-w-xl text-sm text-pika-muted">
            Configure tarifas dinâmicas por categoria — sincronizado com o Firestore
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark"
          >
            + Nova Categoria
          </button>
          <RefreshDataButton onClick={handleRefresh} loading={fetchLoading} />
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
        {sortedCards.map((cat) => {
          const draft = drafts[cat.id] ?? categoriaToInput(cat);
          const headingId = `price-cat-${cat.id}`;
          const badge = multiplierBadge(draft.multiplicador);
          const busy = savingId === cat.id;

          return (
            <WhiteCard key={cat.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 id={headingId} className="text-base font-bold text-pika-ink">
                    {cat.nome}
                  </h3>
                  <span
                    className={cn(
                      "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold text-white",
                      draft.ativo ? "bg-emerald-500" : "bg-slate-400",
                    )}
                  >
                    {draft.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
                <SettingsSwitch
                  checked={draft.ativo}
                  onChange={(next) => patchDraft(cat.id, { ativo: next })}
                  labelledBy={headingId}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-pika-muted">
                    Base (Kz)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.base}
                    onChange={(e) =>
                      patchDraft(cat.id, { base: Number(e.target.value) || 0 })
                    }
                    className={inputClass("mt-1 bg-pika-card")}
                  />
                  <p className="mt-1 text-xs text-pika-muted">{formatKz(draft.base)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-pika-muted">
                    Mínima (Kz)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.minima}
                    onChange={(e) =>
                      patchDraft(cat.id, { minima: Number(e.target.value) || 0 })
                    }
                    className={inputClass("mt-1 bg-pika-card")}
                  />
                  <p className="mt-1 text-xs text-pika-muted">{formatKz(draft.minima)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-pika-muted">
                    Por km (Kz)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.preco_km}
                    onChange={(e) =>
                      patchDraft(cat.id, { preco_km: Number(e.target.value) || 0 })
                    }
                    className={inputClass("mt-1 bg-pika-card")}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide text-pika-muted">
                    Por min (Kz)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={draft.preco_min}
                    onChange={(e) =>
                      patchDraft(cat.id, { preco_min: Number(e.target.value) || 0 })
                    }
                    className={inputClass("mt-1 bg-pika-card")}
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="text-xs font-medium uppercase tracking-wide text-pika-muted">
                  Multiplicador
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={draft.multiplicador}
                  onChange={(e) =>
                    patchDraft(cat.id, {
                      multiplicador: Number(e.target.value) || 0,
                    })
                  }
                  className={inputClass("mt-1 bg-pika-card")}
                />
              </div>

              <div className="mt-3">
                <label className="text-xs font-medium uppercase tracking-wide text-pika-muted">
                  Ordem
                </label>
                <select
                  value={draft.ordem}
                  onChange={(e) =>
                    patchDraft(cat.id, {
                      ordem: Number(e.target.value) as CategoriaInput["ordem"],
                    })
                  }
                  className={inputClass("mt-1 bg-pika-card")}
                >
                  {ORDEM_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 rounded-xl border-2 border-orange-200 bg-orange-50/40 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-orange-700">
                    Multiplicador{" "}
                    x
                    {draft.multiplicador.toLocaleString("pt-AO", {
                      maximumFractionDigits: 1,
                    })}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-bold",
                      badge.tone,
                    )}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void saveInline(cat.id)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-pika-primary py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faFloppyDisk} className="h-4 w-4" />
                  {busy ? "A guardar…" : "Salvar"}
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(cat)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-pika-border bg-pika-page py-2.5 text-sm font-semibold text-pika-ink transition hover:bg-pika-card"
                  >
                    <FontAwesomeIcon icon={faPen} className="h-4 w-4" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingId(cat.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </WhiteCard>
          );
        })}
      </div>

      {sortedCards.length === 0 && !fetchLoading ? (
        <WhiteCard>
          <p className="text-center text-sm text-pika-muted">
            Nenhuma categoria encontrada. Crie uma nova ou atualize os dados.
          </p>
        </WhiteCard>
      ) : null}

      <WhiteCard>
        <h3 className="text-base font-bold text-pika-ink md:text-lg">
          Comparativo de tarifas
        </h3>
        <p className="mt-1 text-sm text-pika-muted">
          Simulação para corrida de {SIMULATION_KM} km — {SIMULATION_MIN} minutos
        </p>
        <div className="mt-5 overflow-x-auto scroll-pika">
          <table className="min-w-[640px] w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-pika-muted">
                <th className="pb-3 pr-4 font-semibold">Categoria</th>
                <th className="pb-3 pr-4 font-semibold">Base</th>
                <th className="pb-3 pr-4 font-semibold">Distância</th>
                <th className="pb-3 pr-4 font-semibold">Tempo</th>
                <th className="pb-3 pr-4 font-semibold">Multiplicador</th>
                <th className="pb-3 font-semibold">Total Est.</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-t border-pika-border",
                    row.highlight ? "bg-pika-page/90" : "bg-transparent",
                  )}
                >
                  <td className="py-3 pr-4 font-medium text-pika-ink">{row.nome}</td>
                  <td className="py-3 pr-4 text-pika-ink">{row.baseLabel}</td>
                  <td className="py-3 pr-4 text-pika-ink">{row.distanceLabel}</td>
                  <td className="py-3 pr-4 text-pika-ink">{row.timeLabel}</td>
                  <td className="py-3 pr-4 text-pika-ink">{row.multiplierLabel}</td>
                  <td className="py-3 font-bold text-pika-ink">{row.totalLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </WhiteCard>

      <CategoryModal
        open={modalOpen}
        mode={modalMode}
        category={modalCategory}
        saving={modalSaving}
        onClose={closeModal}
        onSubmit={(input) => void submitModal(input)}
      />

      <DeleteConfirmModal
        open={deletingId !== null}
        onCancel={() => {
          if (!deleteBusy) setDeletingId(null);
        }}
        onConfirm={() => void confirmDelete()}
        title="Eliminar categoria?"
        description="Esta ação remove a categoria do Firestore. Corridas ou tarifas existentes que dependam deste registo podem precisar de atualização manual. Tem a certeza?"
      />
    </div>
  );
}
