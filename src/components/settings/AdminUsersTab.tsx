"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGrip,
  faList,
  faPen,
  faSpinner,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useState } from "react";
import type { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import {
  type AuthUser,
  NIVEL_ADMIN,
  NIVEL_FINANCEIRO,
  NIVEL_OPERADOR,
  NIVEL_SUPER_ADMIN,
  nivelLabel,
  parseAuthUser,
  unwrapApiData,
} from "@/lib/auth-types";
import { canManageAdminUsers } from "@/lib/permissions";
import { initialsFromDisplayName } from "@/lib/session-user";
import { cn } from "@/lib/cn";

type ViewMode = "cards" | "table";

const NIVEL_OPTIONS = [
  { value: NIVEL_OPERADOR, label: nivelLabel(NIVEL_OPERADOR) },
  { value: NIVEL_FINANCEIRO, label: nivelLabel(NIVEL_FINANCEIRO) },
  { value: NIVEL_ADMIN, label: nivelLabel(NIVEL_ADMIN) },
  { value: NIVEL_SUPER_ADMIN, label: nivelLabel(NIVEL_SUPER_ADMIN) },
];

function inputClass(extra?: string) {
  return cn(
    "mt-1.5 w-full rounded-xl border border-pika-border bg-pika-page px-3 py-2.5 text-sm text-pika-ink outline-none transition placeholder:text-pika-muted/70 focus:border-pika-primary focus:bg-pika-card focus:ring-2 focus:ring-pika-primary/20",
    extra,
  );
}

function extractUsersList(payload: unknown): AuthUser[] {
  const data = unwrapApiData<unknown>(payload);
  if (Array.isArray(data)) {
    return data.map(parseAuthUser).filter((u): u is AuthUser => u !== null);
  }
  if (data && typeof data === "object" && "data" in data) {
    const inner = (data as { data: unknown }).data;
    if (Array.isArray(inner)) {
      return inner.map(parseAuthUser).filter((u): u is AuthUser => u !== null);
    }
  }
  return [];
}

function apiErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === "object" && "response" in err) {
    const ax = err as AxiosError<{ message?: string }>;
    if (ax.response?.data?.message) return ax.response.data.message;
    if (ax.response?.status === 403) return "Sem permissão para esta ação.";
  }
  return fallback;
}

type UserFormState = {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  nivel: number;
};

const emptyForm = (): UserFormState => ({
  name: "",
  email: "",
  password: "",
  password_confirmation: "",
  nivel: NIVEL_OPERADOR,
});

export function AdminUsersTab() {
  const { http, user: currentUser } = useAuth();
  const canManage = currentUser ? canManageAdminUsers(currentUser.nivel) : false;

  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AuthUser | null>(null);
  const [form, setForm] = useState<UserFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    if (!canManage) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await http.get("/users");
      setUsers(extractUsersList(data));
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível carregar os utilizadores."));
    } finally {
      setLoading(false);
    }
  }, [http, canManage]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (user: AuthUser) => {
    setEditing(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      password_confirmation: "",
      nivel: user.nivel,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm());
  };

  const saveUser = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      setError("Nome e e-mail são obrigatórios.");
      return;
    }
    if (!editing && !form.password) {
      setError("Defina uma palavra-passe para o novo utilizador.");
      return;
    }
    if (form.password && form.password !== form.password_confirmation) {
      setError("As palavras-passe não coincidem.");
      return;
    }

    setSaving(true);
    setError(null);

    const body: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim(),
      nivel: form.nivel,
    };
    if (form.password) {
      body.password = form.password;
      body.password_confirmation = form.password_confirmation;
    }

    try {
      if (editing) {
        await http.put(`/users/${editing.id}`, body);
      } else {
        await http.post("/users", body);
      }
      closeModal();
      await loadUsers();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível guardar o utilizador."));
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (user: AuthUser) => {
    if (user.id === currentUser?.id) {
      setError("Não pode eliminar a sua própria conta.");
      return;
    }
    if (
      !window.confirm(
        `Eliminar o utilizador "${user.name}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      return;
    }

    setDeletingId(user.id);
    setError(null);
    try {
      await http.delete(`/users/${user.id}`);
      await loadUsers();
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível eliminar o utilizador."));
    } finally {
      setDeletingId(null);
    }
  };

  const resetPassword = async (user: AuthUser) => {
    if (
      !window.confirm(
        `Enviar nova palavra-passe para ${user.email}?`,
      )
    ) {
      return;
    }
    setError(null);
    try {
      await http.post(`/users/${user.id}/reset-password`);
      alert(`Nova palavra-passe enviada para ${user.email}.`);
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível redefinir a palavra-passe."));
    }
  };

  if (!canManage) {
    return (
      <section className="rounded-2xl border border-pika-border bg-pika-card p-6 shadow-sm">
        <p className="text-sm text-pika-muted">
          Apenas Super Admin pode gerir utilizadores administrativos.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-pika-ink">
            Usuários Administrativos
          </h2>
          <p className="mt-1 text-sm text-pika-muted">
            Gerencie o acesso ao painel (API Laravel)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div
            className="inline-flex rounded-xl border border-pika-border bg-pika-page p-1"
            role="group"
            aria-label="Modo de visualização"
          >
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg transition",
                viewMode === "cards"
                  ? "bg-pika-primary text-white shadow-sm"
                  : "text-pika-muted hover:bg-pika-card hover:text-pika-ink",
              )}
              aria-label="Visualização em cartões"
              aria-pressed={viewMode === "cards"}
            >
              <FontAwesomeIcon icon={faGrip} className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex h-9 w-9 items-center justify-center rounded-lg transition",
                viewMode === "table"
                  ? "bg-pika-primary text-white shadow-sm"
                  : "text-pika-muted hover:bg-pika-card hover:text-pika-ink",
              )}
              aria-label="Visualização em tabela"
              aria-pressed={viewMode === "table"}
            >
              <FontAwesomeIcon icon={faList} className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark"
          >
            + Novo Usuário
          </button>
        </div>
      </div>

      {error ? (
        <p
          className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-pika-muted">
          <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin" />
          <span className="text-sm font-medium">A carregar utilizadores…</span>
        </div>
      ) : users.length === 0 ? (
        <p className="py-12 text-center text-sm text-pika-muted">
          Nenhum utilizador encontrado.
        </p>
      ) : viewMode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {users.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              isSelf={u.id === currentUser?.id}
              deleting={deletingId === u.id}
              onEdit={() => openEdit(u)}
              onDelete={() => void deleteUser(u)}
              onResetPassword={() => void resetPassword(u)}
            />
          ))}
        </div>
      ) : (
        <UsersTable
          users={users}
          currentUserId={currentUser?.id}
          deletingId={deletingId}
          onEdit={openEdit}
          onDelete={(u) => void deleteUser(u)}
          onResetPassword={(u) => void resetPassword(u)}
        />
      )}

      {modalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-pika-border bg-pika-card p-6 shadow-xl">
            <h3 className="text-lg font-bold text-pika-ink">
              {editing ? "Editar utilizador" : "Novo utilizador"}
            </h3>
            <div className="mt-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-pika-ink">Nome</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-pika-ink">E-mail</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={inputClass()}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-pika-ink">Função</label>
                <select
                  value={form.nivel}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nivel: Number(e.target.value) }))
                  }
                  className={inputClass()}
                >
                  {NIVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-pika-ink">
                  {editing ? "Nova palavra-passe (opcional)" : "Palavra-passe"}
                </label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  className={inputClass()}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-pika-ink">
                  Confirmar palavra-passe
                </label>
                <input
                  type="password"
                  value={form.password_confirmation}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      password_confirmation: e.target.value,
                    }))
                  }
                  className={inputClass()}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-pika-muted hover:bg-pika-page"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void saveUser()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-pika-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-pika-primary-dark disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin" />
                    A guardar…
                  </>
                ) : (
                  "Guardar"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function UserCard({
  user,
  isSelf,
  deleting,
  onEdit,
  onDelete,
  onResetPassword,
}: {
  user: AuthUser;
  isSelf: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onResetPassword: () => void;
}) {
  const initials = initialsFromDisplayName(user.name);

  return (
    <article className="flex flex-col rounded-2xl border border-pika-border bg-pika-page/50 p-4 transition hover:border-pika-primary/30 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-pika-primary text-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-pika-ink">{user.name}</p>
          <p className="truncate text-xs text-pika-muted">{user.email}</p>
          <span className="mt-2 inline-flex rounded-full bg-pika-card px-2.5 py-1 text-xs font-semibold text-pika-ink ring-1 ring-pika-border">
            {nivelLabel(user.nivel)}
          </span>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-pika-border pt-3">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-pika-border bg-pika-card px-2 py-2 text-xs font-semibold text-pika-ink hover:bg-pika-page"
        >
          <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          type="button"
          onClick={onResetPassword}
          className="inline-flex flex-1 items-center justify-center rounded-lg border border-pika-border bg-pika-card px-2 py-2 text-xs font-semibold text-pika-ink hover:bg-pika-page"
        >
          Redefinir senha
        </button>
        {!isSelf ? (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
            aria-label="Eliminar"
          >
            <FontAwesomeIcon
              icon={deleting ? faSpinner : faTrash}
              className={cn("h-4 w-4", deleting && "animate-spin")}
            />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function UsersTable({
  users,
  currentUserId,
  deletingId,
  onEdit,
  onDelete,
  onResetPassword,
}: {
  users: AuthUser[];
  currentUserId?: number;
  deletingId: number | null;
  onEdit: (user: AuthUser) => void;
  onDelete: (user: AuthUser) => void;
  onResetPassword: (user: AuthUser) => void;
}) {
  return (
    <div className="overflow-x-auto scroll-pika rounded-xl border border-pika-border">
      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-pika-border bg-pika-page/90 text-xs font-semibold uppercase tracking-wide text-pika-muted">
            <th className="px-4 py-3">Usuário</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Função</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, idx) => (
            <tr
              key={u.id}
              className={cn(
                "border-b border-pika-border transition-colors last:border-b-0",
                idx % 2 === 1 ? "bg-pika-page/90" : "bg-pika-card hover:bg-pika-page/80",
              )}
            >
              <td className="px-4 py-4 font-semibold text-pika-ink">{u.name}</td>
              <td className="px-4 py-4 text-pika-muted">{u.email}</td>
              <td className="px-4 py-4 text-pika-ink">{nivelLabel(u.nivel)}</td>
              <td className="px-4 py-4 text-right">
                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(u)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-ink transition hover:bg-pika-page"
                    aria-label="Editar"
                  >
                    <FontAwesomeIcon icon={faPen} className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onResetPassword(u)}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-pika-primary hover:bg-pika-page"
                  >
                    Senha
                  </button>
                  {u.id !== currentUserId ? (
                    <button
                      type="button"
                      onClick={() => onDelete(u)}
                      disabled={deletingId === u.id}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      aria-label="Eliminar"
                    >
                      <FontAwesomeIcon
                        icon={deletingId === u.id ? faSpinner : faTrash}
                        className={cn(
                          "h-4 w-4",
                          deletingId === u.id && "animate-spin",
                        )}
                      />
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
