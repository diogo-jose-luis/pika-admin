"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import {
  ORDEM_OPTIONS,
  type Categoria,
  type CategoriaInput,
  categoriaToInput,
} from "@/lib/categorias";
import { cn } from "@/lib/cn";

const EMPTY_FORM: CategoriaInput = {
  nome: "",
  base: 0,
  minima: 0,
  preco_km: 0,
  preco_min: 0,
  multiplicador: 1,
  ativo: true,
  imagem: "",
  ordem: 1,
};

type CategoryModalProps = {
  open: boolean;
  mode: "create" | "edit";
  category?: Categoria | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (input: CategoriaInput) => void;
};

function fieldClass(extra?: string) {
  return cn(
    "mt-1.5 w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition placeholder:text-pika-muted/70 focus:border-pika-primary focus:bg-pika-card focus:ring-2 focus:ring-pika-primary/20",
    extra,
  );
}

export function CategoryModal({
  open,
  mode,
  category,
  saving = false,
  onClose,
  onSubmit,
}: CategoryModalProps) {
  const [form, setForm] = useState<CategoriaInput>(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(category ? categoriaToInput(category) : { ...EMPTY_FORM });
  }, [open, category]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  if (!open) return null;

  const title = mode === "create" ? "Nova Categoria" : "Editar Categoria";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-title"
        className="max-h-[min(92vh,720px)] w-full max-w-lg overflow-y-auto rounded-2xl bg-pika-card shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-pika-border px-5 py-4">
          <h2 id="category-modal-title" className="text-lg font-bold text-pika-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-ink disabled:opacity-50"
            aria-label="Fechar"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <form
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
        >
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              Nome
            </label>
            <input
              type="text"
              required
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className={fieldClass()}
              placeholder="Ex.: Pika Padrão"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              Ordem
            </label>
            <select
              value={form.ordem}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  ordem: Number(e.target.value) as CategoriaInput["ordem"],
                }))
              }
              className={fieldClass()}
            >
              {ORDEM_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
                Base (Kz)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.base}
                onChange={(e) =>
                  setForm((f) => ({ ...f, base: Number(e.target.value) || 0 }))
                }
                className={fieldClass()}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
                Mínima (Kz)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.minima}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minima: Number(e.target.value) || 0 }))
                }
                className={fieldClass()}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
                Por km (Kz)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.preco_km}
                onChange={(e) =>
                  setForm((f) => ({ ...f, preco_km: Number(e.target.value) || 0 }))
                }
                className={fieldClass()}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
                Por min (Kz)
              </label>
              <input
                type="number"
                min={0}
                step={1}
                value={form.preco_min}
                onChange={(e) =>
                  setForm((f) => ({ ...f, preco_min: Number(e.target.value) || 0 }))
                }
                className={fieldClass()}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              Multiplicador
            </label>
            <input
              type="number"
              min={0}
              step={0.1}
              value={form.multiplicador}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  multiplicador: Number(e.target.value) || 0,
                }))
              }
              className={fieldClass()}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-pika-muted">
              URL da imagem (opcional)
            </label>
            <input
              type="url"
              value={form.imagem}
              onChange={(e) => setForm((f) => ({ ...f, imagem: e.target.value }))}
              className={fieldClass()}
              placeholder="https://..."
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-pika-border bg-pika-page px-4 py-3">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
              className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
            />
            <span className="text-sm font-medium text-pika-ink">Categoria ativa</span>
          </label>

          <div className="flex flex-col-reverse gap-2 border-t border-pika-border pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-pika-border px-4 py-2.5 text-sm font-semibold text-pika-ink transition hover:bg-pika-page disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-pika-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:opacity-50"
            >
              {saving ? "A guardar…" : mode === "create" ? "Criar categoria" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
