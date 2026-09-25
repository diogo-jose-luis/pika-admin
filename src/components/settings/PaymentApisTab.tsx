"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faPlus, faTrash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { FaIcon } from "@/components/ui/FaIcon";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { PaymentApiModal } from "@/components/settings/PaymentApiModal";
import { cn } from "@/lib/cn";
import {
  apiPagamentoMatchesSearch,
  maskApiKey,
  sortApiPagamentos,
  type ApiPagamento,
  type ApiPagamentoInput,
} from "@/lib/api-pagamentos";

export function PaymentApisTab() {
  const [items, setItems] = useState<ApiPagamento[]>([]);
  const [search, setSearch] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalRecord, setModalRecord] = useState<ApiPagamento | null>(null);
  const [modalSaving, setModalSaving] = useState(false);

  const [deleting, setDeleting] = useState<ApiPagamento | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const fetchItems = useCallback(async () => {
    setFetchLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/api-pagamentos", { cache: "no-store" });
      const data = (await res.json()) as { items?: ApiPagamento[]; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível carregar as APIs de pagamento.");
      }
      setItems(sortApiPagamentos(data.items ?? []));
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Erro ao carregar as APIs de pagamento.";
      setError(msg);
    } finally {
      setFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const filtered = useMemo(
    () => items.filter((item) => apiPagamentoMatchesSearch(item, search)),
    [items, search],
  );
  const searchActive = search.trim().length > 0;

  const openCreate = useCallback(() => {
    setModalMode("create");
    setModalRecord(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((item: ApiPagamento) => {
    setModalMode("edit");
    setModalRecord(item);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    if (modalSaving) return;
    setModalOpen(false);
    setModalRecord(null);
  }, [modalSaving]);

  const submitModal = useCallback(
    async (input: ApiPagamentoInput) => {
      setModalSaving(true);
      setError(null);
      try {
        if (modalMode === "create") {
          const res = await fetch("/api/api-pagamentos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(input),
          });
          const data = (await res.json()) as { item?: ApiPagamento; error?: string };
          if (!res.ok) {
            throw new Error(data.error || "Não foi possível criar a API de pagamento.");
          }
          if (!data.item) throw new Error("Resposta inválida do servidor.");
          setItems((prev) => sortApiPagamentos([...prev, data.item!]));
          setModalOpen(false);
          setModalRecord(null);
          return;
        }

        if (!modalRecord) return;
        const res = await fetch(`/api/api-pagamentos/${modalRecord.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = (await res.json()) as { item?: ApiPagamento; error?: string };
        if (!res.ok) {
          throw new Error(data.error || "Não foi possível atualizar a API de pagamento.");
        }
        if (!data.item) throw new Error("Resposta inválida do servidor.");
        setItems((prev) =>
          sortApiPagamentos(prev.map((item) => (item.id === data.item!.id ? data.item! : item))),
        );
        setModalOpen(false);
        setModalRecord(null);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao guardar.";
        setError(msg);
      } finally {
        setModalSaving(false);
      }
    },
    [modalMode, modalRecord],
  );

  const confirmDelete = useCallback(async () => {
    if (deleteBusy || !deleting) return;
    setDeleteBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/api-pagamentos/${deleting.id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Não foi possível eliminar a API de pagamento.");
      }
      setItems((prev) => prev.filter((item) => item.id !== deleting.id));
      setDeleting(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao eliminar.";
      setError(msg);
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteBusy, deleting]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-pika-ink md:text-xl">API de Pagamentos</h2>
          <p className="mt-1 max-w-xl text-sm text-pika-muted">
            Gerencie provedores, URL base e chaves da coleção api_pagamentos
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark"
          >
            <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
            Nova API
          </button>
          <RefreshDataButton onClick={() => void fetchItems()} loading={fetchLoading} />
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative min-w-0 flex-1">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-pika-muted">
            <FaIcon name="search" className="h-4 w-4" />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={fetchLoading}
            placeholder="Filtrar por provedor ou URL…"
            className="w-full rounded-xl border border-pika-border bg-pika-card py-2.5 pl-11 pr-10 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Filtro de APIs de pagamento"
          />
          {searchActive ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-pika-muted transition hover:text-pika-ink"
              aria-label="Limpar filtro"
            >
              <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
            </button>
          ) : null}
        </div>
        {!fetchLoading && items.length > 0 ? (
          <p className="shrink-0 text-sm text-pika-muted">
            {searchActive
              ? `${filtered.length} de ${items.length} API${items.length === 1 ? "" : "s"}`
              : `${items.length} API${items.length === 1 ? "" : "s"}`}
          </p>
        ) : null}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto scroll-pika rounded-2xl border border-pika-border bg-pika-card shadow-sm">
        <table className="min-w-[720px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-pika-border bg-pika-page/90 text-xs font-semibold uppercase tracking-wide text-pika-muted">
              <th className="px-4 py-3">Provedor</th>
              <th className="px-4 py-3">URL base</th>
              <th className="px-4 py-3">Chave da API</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {fetchLoading && items.length === 0 ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i} className="border-b border-pika-border">
                  <td colSpan={4} className="px-4 py-4">
                    <div className="h-8 animate-pulse rounded-lg bg-pika-page" />
                  </td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-pika-muted">
                  Nenhuma API de pagamento registada. Crie a primeira para começar.
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-pika-muted">
                  Nenhum registo corresponde ao filtro.{" "}
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="font-semibold text-pika-primary transition hover:text-pika-primary-dark"
                  >
                    Limpar filtro
                  </button>
                </td>
              </tr>
            ) : (
              filtered.map((item, idx) => (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b border-pika-border transition hover:bg-pika-page/60",
                    idx % 2 === 1 && "bg-pika-page/40",
                  )}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-pika-ink">
                    {item.provedor}
                  </td>
                  <td className="max-w-[320px] truncate px-4 py-3 text-pika-muted" title={item.base_url}>
                    {item.base_url || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-pika-muted">
                    {maskApiKey(item.api_key)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-pika-border bg-pika-page text-pika-muted transition hover:bg-pika-card hover:text-pika-ink"
                        aria-label={`Editar ${item.provedor}`}
                      >
                        <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(item)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-pika-border bg-pika-page text-red-600 transition hover:bg-red-50"
                        aria-label={`Eliminar ${item.provedor}`}
                      >
                        <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PaymentApiModal
        open={modalOpen}
        mode={modalMode}
        record={modalRecord}
        saving={modalSaving}
        onClose={closeModal}
        onSubmit={(input) => void submitModal(input)}
      />

      <DeleteConfirmModal
        open={deleting !== null}
        busy={deleteBusy}
        entityLabel={deleting?.provedor}
        onCancel={() => {
          if (!deleteBusy) setDeleting(null);
        }}
        onConfirm={() => void confirmDelete()}
        title="Eliminar API de pagamentos?"
        description="Esta ação remove o provedor da coleção api_pagamentos. Integrações que dependam desta chave deixam de funcionar. Tem a certeza?"
      />
    </div>
  );
}
