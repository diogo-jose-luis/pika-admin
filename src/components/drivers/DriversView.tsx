"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DriverDetailsModal } from "@/components/drivers/DriverDetailsModal";
import { DeleteConfirmModal } from "@/components/ui/DeleteConfirmModal";
import { RefreshDataButton } from "@/components/ui/RefreshDataButton";
import { useAuth } from "@/context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCar,
  faChevronDown,
  faCircleCheck,
  faDownload,
  faEllipsisVertical,
  faEnvelope,
  faGaugeHigh,
  faLocationDot,
  faMagnifyingGlass,
  faPhone,
  faStar,
  faUserCheck,
  faUserMinus,
  faUserTag,
} from "@fortawesome/free-solid-svg-icons";
import {
  driverMatchesSearch,
  type DriverCard,
  type DriverStatus,
  type DriversSummary,
} from "@/lib/drivers";
import { canManageAdminUsers } from "@/lib/permissions";
import { USER_ESTADO_BULK_OPTIONS } from "@/lib/users-estado";
import { USER_ONLINE_BULK_OPTIONS } from "@/lib/users-online";
import { cn } from "@/lib/cn";

const DOC_OPTIONS = ["Todos", "Completa", "Pendente"] as const;

function DriverStatusBadge({ status }: { status: DriverStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "Ativo"
          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
          : "bg-red-50 text-red-700 ring-1 ring-red-100",
      )}
    >
      {status}
    </span>
  );
}

function DriverOnlineBadge({ online }: { online: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-semibold",
        online
          ? "bg-sky-50 text-sky-700 ring-1 ring-sky-100"
          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
      )}
    >
      {online ? "Online" : "Offline"}
    </span>
  );
}

const EMPTY_SUMMARY: DriversSummary = {
  total: 0,
  active: 0,
  inactive: 0,
  avgRating: "—",
};

export function DriversView() {
  const { user } = useAuth();
  const isSuperAdmin = user ? canManageAdminUsers(user.nivel) : false;
  const [drivers, setDrivers] = useState<DriverCard[]>([]);
  const [summary, setSummary] = useState<DriversSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | DriverStatus>("Todos");
  const [docFilter, setDocFilter] = useState<(typeof DOC_OPTIONS)[number]>("Todos");
  const [detailDriver, setDetailDriver] = useState<DriverCard | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DriverCard | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEstado, setBulkEstado] = useState("1");
  const [bulkOnline, setBulkOnline] = useState("true");
  const [bulkSaving, setBulkSaving] = useState(false);

  const loadDrivers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/motoristas", { cache: "no-store" });
      const data = (await res.json()) as {
        drivers?: DriverCard[];
        summary?: DriversSummary;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Erro ao carregar motoristas.");
      }

      setDrivers(data.drivers ?? []);
      setSummary(data.summary ?? EMPTY_SUMMARY);
      setSelectedIds(new Set());
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Erro ao carregar motoristas.",
      );
      setDrivers([]);
      setSummary(EMPTY_SUMMARY);
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  const filtered = useMemo(() => {
    return drivers.filter((d) => {
      if (statusFilter !== "Todos" && d.status !== statusFilter) return false;
      if (docFilter === "Completa" && !d.verified) return false;
      if (docFilter === "Pendente" && d.verified) return false;
      return driverMatchesSearch(d, search);
    });
  }, [drivers, search, statusFilter, docFilter]);

  const visibleIds = useMemo(
    () => filtered.map((d) => d.userDocId),
    [filtered],
  );
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  };

  const toggleSelect = (userDocId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userDocId)) next.delete(userDocId);
      else next.add(userDocId);
      return next;
    });
  };

  const applyBulkEstado = async () => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/motoristas/estado", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selectedIds],
          estado: Number(bulkEstado),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível atualizar o estado.");
      }
      await loadDrivers(true);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Não foi possível atualizar o estado.",
      );
    } finally {
      setBulkSaving(false);
    }
  };

  const applyBulkOnline = async () => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/motoristas/online", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selectedIds],
          online: bulkOnline === "true",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(
          data.error ?? "Não foi possível atualizar a disponibilidade online.",
        );
      }
      await loadDrivers(true);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar a disponibilidade online.",
      );
    } finally {
      setBulkSaving(false);
    }
  };

  const applyBulkToPassenger = async () => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/users/perfil", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selectedIds],
          isDriver: 0,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(
          data.error ?? "Não foi possível converter para passageiro.",
        );
      }
      await loadDrivers(true);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Não foi possível converter para passageiro.",
      );
    } finally {
      setBulkSaving(false);
    }
  };

  const confirmDeleteDriver = useCallback(async () => {
    if (!deleteTarget || deleteBusy || !isSuperAdmin) return;

    setDeleteBusy(true);
    setLoadError(null);

    try {
      const res = await fetch("/api/motoristas", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [deleteTarget.userDocId] }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível eliminar o motorista.");
      }

      const id = deleteTarget.userDocId;
      setDrivers((prev) => prev.filter((d) => d.userDocId !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDetailDriver((current) =>
        current?.userDocId === id ? null : current,
      );
      setDeleteTarget(null);
      await loadDrivers(true);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : "Não foi possível eliminar o motorista.",
      );
    } finally {
      setDeleteBusy(false);
    }
  }, [deleteTarget, deleteBusy, isSuperAdmin, loadDrivers]);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Total Motoristas</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {loading ? "…" : summary.total}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <FontAwesomeIcon icon={faGaugeHigh} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Ativos</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {loading ? "…" : summary.active}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <FontAwesomeIcon icon={faUserCheck} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Inativos</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {loading ? "…" : summary.inactive}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FontAwesomeIcon icon={faUserMinus} className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-pika-muted">Avaliação Média</p>
              <p className="mt-2 text-3xl font-bold text-pika-ink">
                {loading ? "…" : summary.avgRating}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <FontAwesomeIcon icon={faStar} className="h-6 w-6" />
            </div>
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-pika-border bg-pika-page/90 p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-pika-muted">
              <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4" />
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail, telefone, viatura, matrícula, ID..."
              className="w-full rounded-xl border border-pika-border bg-pika-card py-2.5 pl-11 pr-3 text-sm text-pika-ink outline-none ring-pika-primary/25 transition placeholder:text-pika-muted/80 focus:border-pika-primary focus:ring-2"
            />
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "Todos" | DriverStatus)
              }
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
            >
              <option value="Todos">Todos</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
            </select>
            <select
              value={docFilter}
              onChange={(e) =>
                setDocFilter(e.target.value as (typeof DOC_OPTIONS)[number])
              }
              className="rounded-xl border border-pika-border bg-pika-card px-3 py-2.5 text-sm font-medium text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
            >
              {DOC_OPTIONS.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
            <RefreshDataButton
              loading={refreshing}
              onClick={() => void loadDrivers(true)}
            />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border border-pika-primary bg-pika-card px-4 py-2.5 text-sm font-semibold text-pika-primary shadow-sm transition hover:bg-pika-primary hover:text-white"
            >
              <FontAwesomeIcon icon={faDownload} className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>
      </div>

      {loadError ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700 shadow-sm">
          {loadError}
        </p>
      ) : null}

      {!loading && filtered.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-pika-border bg-pika-page/90 px-4 py-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-pika-ink">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
              className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
            />
            Selecionar visíveis ({filtered.length})
          </label>
        </div>
      ) : null}

      {selectedIds.size > 0 ? (
        <div className="flex flex-col gap-3 rounded-xl border border-pika-primary/30 bg-pika-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-semibold text-pika-ink">
            {selectedIds.size} motorista(s) selecionado(s)
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[10rem]">
              <select
                value={bulkEstado}
                onChange={(e) => setBulkEstado(e.target.value)}
                disabled={bulkSaving}
                className="w-full appearance-none rounded-xl border border-pika-border bg-pika-card py-2 pl-3 pr-9 text-sm font-medium text-pika-ink outline-none focus:border-pika-primary focus:ring-2 focus:ring-pika-primary/20 disabled:opacity-50"
                aria-label="Novo estado da conta"
              >
                {USER_ESTADO_BULK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-pika-muted">
                <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" />
              </span>
            </div>
            <button
              type="button"
              onClick={() => void applyBulkEstado()}
              disabled={bulkSaving}
              className="inline-flex items-center justify-center rounded-xl border border-pika-border bg-pika-card px-4 py-2 text-sm font-semibold text-pika-ink shadow-sm transition hover:bg-pika-page disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkSaving ? "A aplicar…" : "Aplicar estado"}
            </button>
            <div className="relative min-w-[10rem]">
              <select
                value={bulkOnline}
                onChange={(e) => setBulkOnline(e.target.value)}
                disabled={bulkSaving}
                className="w-full appearance-none rounded-xl border border-pika-border bg-pika-card py-2 pl-3 pr-9 text-sm font-medium text-pika-ink outline-none focus:border-pika-primary focus:ring-2 focus:ring-pika-primary/20 disabled:opacity-50"
                aria-label="Disponibilidade online"
              >
                {USER_ONLINE_BULK_OPTIONS.map((opt) => (
                  <option key={String(opt.value)} value={String(opt.value)}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute inset-y-0 right-0 flex w-9 items-center justify-center text-pika-muted">
                <FontAwesomeIcon icon={faChevronDown} className="h-3 w-3" />
              </span>
            </div>
            <button
              type="button"
              onClick={() => void applyBulkOnline()}
              disabled={bulkSaving}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {bulkSaving ? "A aplicar…" : "Aplicar online/offline"}
            </button>
            <button
              type="button"
              onClick={() => void applyBulkToPassenger()}
              disabled={bulkSaving}
              className="inline-flex items-center gap-2 rounded-xl border border-pika-primary bg-pika-card px-4 py-2 text-sm font-semibold text-pika-primary shadow-sm transition hover:bg-pika-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faUserTag} className="h-3.5 w-3.5" />
              {bulkSaving ? "A converter…" : "Converter para passageiro"}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              disabled={bulkSaving}
              className="inline-flex items-center justify-center rounded-xl border border-pika-border bg-pika-card px-4 py-2 text-sm font-semibold text-pika-muted transition hover:text-pika-ink disabled:opacity-50"
            >
              Limpar
            </button>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-2xl border border-pika-border bg-pika-card"
            />
          ))}
        </div>
      ) : null}

      {!loading && !loadError && filtered.length === 0 ? (
        <p className="rounded-2xl border border-pika-border bg-pika-card p-8 text-center text-sm text-pika-muted shadow-sm">
          Nenhum motorista encontrado com estes critérios.
        </p>
      ) : null}

      {!loading && !loadError && filtered.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((driver) => (
            <DriverCard
              key={driver.userDocId}
              driver={driver}
              selected={selectedIds.has(driver.userDocId)}
              onToggleSelect={() => toggleSelect(driver.userDocId)}
              onViewDetails={() => setDetailDriver(driver)}
              onDelete={
                isSuperAdmin ? () => setDeleteTarget(driver) : undefined
              }
            />
          ))}
        </section>
      ) : null}

      {detailDriver ? (
        <DriverDetailsModal
          driver={detailDriver}
          onClose={() => setDetailDriver(null)}
        />
      ) : null}

      <DeleteConfirmModal
        open={deleteTarget !== null}
        onConfirm={() => void confirmDeleteDriver()}
        onCancel={() => {
          if (!deleteBusy) setDeleteTarget(null);
        }}
        title="Eliminar motorista?"
        entityLabel={
          deleteTarget
            ? `${deleteTarget.name} (${deleteTarget.id})`
            : undefined
        }
        description="Tem certeza de que deseja eliminar este motorista? Esta ação é irreversível e remove o registo do utilizador e a viatura associada."
        confirmLabel="Eliminar motorista"
        busy={deleteBusy}
      />
    </div>
  );
}

function DriverCard({
  driver,
  selected,
  onToggleSelect,
  onViewDetails,
  onDelete,
}: {
  driver: DriverCard;
  selected: boolean;
  onToggleSelect: () => void;
  onViewDetails: () => void;
  onDelete?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const openDetails = () => {
    setMenuOpen(false);
    onViewDetails();
  };

  const deleteDriver = () => {
    if (!onDelete) return;
    setMenuOpen(false);
    onDelete();
  };

  return (
    <article
      className={cn(
        "relative flex flex-col rounded-2xl border bg-pika-card p-5 shadow-sm transition-shadow hover:shadow-md",
        selected ? "border-pika-primary ring-2 ring-pika-primary/20" : "border-pika-border",
      )}
    >
      <label className="absolute left-3 top-3 z-10 flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Selecionar ${driver.name}`}
          className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
        />
      </label>
      <div className="flex items-start justify-between gap-3 pl-7">
        <div className="flex min-w-0 flex-1 gap-3">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold",
              driver.avatarClass,
            )}
          >
            {driver.initials}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3 className="truncate text-base font-bold text-pika-ink">
                {driver.name}
              </h3>
              {driver.verified ? (
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  className="h-4 w-4 shrink-0 text-emerald-500"
                  title="Verificado"
                />
              ) : null}
            </div>
            <p className="mt-0.5 text-xs font-medium text-pika-muted">{driver.id}</p>
          </div>
        </div>
        <div ref={menuRef} className="relative flex shrink-0 flex-wrap items-center justify-end gap-1.5">
          <DriverStatusBadge status={driver.status} />
          <DriverOnlineBadge online={driver.online} />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-muted transition hover:bg-pika-page hover:text-pika-ink",
              menuOpen && "bg-pika-page text-pika-ink",
            )}
            aria-label="Mais opções"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <FontAwesomeIcon icon={faEllipsisVertical} className="h-4 w-4" />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-pika-border bg-pika-card p-2 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={openDetails}
                className="w-full rounded-lg bg-pika-primary px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-pika-primary-dark"
              >
                Ver detalhes
              </button>
              {onDelete ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={deleteDriver}
                  className="mt-1 w-full rounded-lg px-3 py-2 text-center text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Eliminar Motorista
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <ul className="mt-4 space-y-2.5 pl-7 text-sm text-pika-ink">
        <li className="flex items-start gap-2.5 text-pika-muted">
          <FontAwesomeIcon
            icon={faEnvelope}
            className="mt-0.5 h-4 w-4 shrink-0 text-pika-primary"
          />
          <span className="min-w-0 break-all">{driver.email}</span>
        </li>
        <li className="flex items-start gap-2.5 text-pika-muted">
          <FontAwesomeIcon
            icon={faPhone}
            className="mt-0.5 h-4 w-4 shrink-0 text-pika-primary"
          />
          <span>{driver.phone}</span>
        </li>
        <li className="flex items-start gap-2.5 text-pika-muted">
          <FontAwesomeIcon
            icon={faCar}
            className="mt-0.5 h-4 w-4 shrink-0 text-pika-primary"
          />
          <span className="leading-snug">{driver.vehicle}</span>
        </li>
        <li className="flex items-start gap-2.5 text-pika-muted">
          <FontAwesomeIcon
            icon={faLocationDot}
            className="mt-0.5 h-4 w-4 shrink-0 text-pika-primary"
          />
          <span className="min-w-0">
            <span className="block text-xs font-semibold uppercase tracking-wide text-pika-ink/80">
              Última localização
            </span>
            {driver.lastLocationMapsUrl ? (
              <a
                href={driver.lastLocationMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-0.5 inline-block font-mono text-xs text-pika-primary underline-offset-2 hover:underline"
              >
                {driver.lastLocationLabel}
              </a>
            ) : (
              <span className="mt-0.5 block text-sm">{driver.lastLocationLabel}</span>
            )}
          </span>
        </li>
      </ul>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-pika-border pt-4 text-center text-xs sm:text-sm">
        <div>
          <p className="flex flex-wrap items-center justify-center gap-1 text-pika-ink">
            <FontAwesomeIcon icon={faStar} className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-semibold">{driver.rating}</span>
            <span className="text-pika-muted">Avaliação</span>
          </p>
        </div>
        <div>
          <p className="font-semibold text-pika-ink">{driver.rides}</p>
          <p className="mt-0.5 text-pika-muted">Corridas</p>
        </div>
        <div>
          <p className="font-bold text-pika-ink">
            Kz {driver.earningsKz}
          </p>
          <p className="mt-0.5 text-pika-muted">Ganhos</p>
        </div>
      </div>
    </article>
  );
}
