"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faBell,
  faDollarSign,
  faFloppyDisk,
  faListCheck,
  faPen,
  faShieldHalved,
  faTrash,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { useCallback, useEffect, useId, useState } from "react";
import { cn } from "@/lib/cn";
import { PriceSimulatorCard } from "@/components/settings/PriceSimulatorCard";
import { PricesCategoriesTab } from "@/components/settings/PricesCategoriesTab";

type TabId = "fees" | "users" | "notifications" | "rules" | "prices";

const TABS: { id: TabId; label: string; icon: IconDefinition }[] = [
  { id: "fees", label: "Taxas e Comissões", icon: faDollarSign },
  { id: "users", label: "Usuários Admin", icon: faUsers },
  { id: "notifications", label: "Notificações", icon: faBell },
  { id: "rules", label: "Regras do Sistema", icon: faShieldHalved },
  { id: "prices", label: "Preços e Categorias", icon: faListCheck },
];

const ADMIN_USERS = [
  {
    id: "1",
    name: "Maria Silva",
    email: "maria.silva@email.com",
    role: "Super Admin",
    active: true,
  },
  {
    id: "2",
    name: "João Santos",
    email: "maria.silva@email.com",
    role: "Admin",
    active: true,
  },
  {
    id: "3",
    name: "Courtney Henry",
    email: "maria.silva@email.com",
    role: "Operador",
    active: true,
  },
  {
    id: "4",
    name: "Kathryn Murphy",
    email: "maria.silva@email.com",
    role: "Financeiro",
    active: false,
  },
];

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
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-pika-border bg-pika-card p-5 shadow-sm md:p-6",
        className,
      )}
    >
      {children}
    </section>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-pika-ink md:text-lg">{children}</h2>
  );
}

export function SettingsView() {
  const [tab, setTab] = useState<TabId>("fees");

  const [notifNewRide, setNotifNewRide] = useState(false);
  const [notifCancelled, setNotifCancelled] = useState(true);
  const [notifDriverIssue, setNotifDriverIssue] = useState(true);
  const [notifAppUpdates1, setNotifAppUpdates1] = useState(true);
  const [notifAppUpdates2, setNotifAppUpdates2] = useState(true);
  const [notifGeneral, setNotifGeneral] = useState(false);

  const [secDocs, setSecDocs] = useState(true);
  const [secPhoto, setSecPhoto] = useState(true);
  const [secShare, setSecShare] = useState(true);
  const [secAudio, setSecAudio] = useState(false);

  const n1 = useId();
  const n2 = useId();
  const n3 = useId();
  const n4 = useId();
  const n5 = useId();
  const n6 = useId();

  const s1 = useId();
  const s2 = useId();
  const s3 = useId();
  const s4 = useId();

  return (
    <div className="space-y-5">
      <WhiteCard className="p-2 md:p-2">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold transition sm:flex-none sm:px-4 sm:text-sm",
                tab === t.id
                  ? "bg-pika-primary text-white shadow-sm"
                  : "text-pika-ink hover:bg-pika-page",
              )}
            >
              <FontAwesomeIcon icon={t.icon} className="h-4 w-4 shrink-0" />
              <span className="text-center leading-tight">{t.label}</span>
            </button>
          ))}
        </div>
      </WhiteCard>

      {tab === "fees" ? <FeesTab /> : null}
      {tab === "users" ? <UsersTab /> : null}
      {tab === "notifications" ? (
        <NotificationsTab
          notifNewRide={notifNewRide}
          setNotifNewRide={setNotifNewRide}
          notifCancelled={notifCancelled}
          setNotifCancelled={setNotifCancelled}
          notifDriverIssue={notifDriverIssue}
          setNotifDriverIssue={setNotifDriverIssue}
          notifAppUpdates1={notifAppUpdates1}
          setNotifAppUpdates1={setNotifAppUpdates1}
          notifAppUpdates2={notifAppUpdates2}
          setNotifAppUpdates2={setNotifAppUpdates2}
          notifGeneral={notifGeneral}
          setNotifGeneral={setNotifGeneral}
          ids={[n1, n2, n3, n4, n5, n6]}
        />
      ) : null}
      {tab === "rules" ? (
        <RulesTab
          secDocs={secDocs}
          setSecDocs={setSecDocs}
          secPhoto={secPhoto}
          setSecPhoto={setSecPhoto}
          secShare={secShare}
          setSecShare={setSecShare}
          secAudio={secAudio}
          setSecAudio={setSecAudio}
          ids={[s1, s2, s3, s4]}
        />
      ) : null}
      {tab === "prices" ? <PricesCategoriesTab /> : null}
    </div>
  );
}

function FeesTab() {
  const [tarifaBase, setTarifaBase] = useState("");
  const [tarifaPorKm, setTarifaPorKm] = useState("");
  const [comissaoPadrao, setComissaoPadrao] = useState("");
  const [comissaoDocId, setComissaoDocId] = useState<string | null>(null);
  const [comissaoLoading, setComissaoLoading] = useState(true);
  const [comissaoSaving, setComissaoSaving] = useState(false);
  const [comissaoMessage, setComissaoMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const loadComissaoPadrao = useCallback(async () => {
    setComissaoLoading(true);
    setComissaoMessage(null);

    try {
      const res = await fetch("/api/comissao", { cache: "no-store" });
      const data = (await res.json()) as {
        record?: { id: string; valor: number } | null;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível carregar a comissão.");
      }

      if (data.record) {
        setComissaoDocId(data.record.id);
        setComissaoPadrao(String(data.record.valor));
      } else {
        setComissaoDocId(null);
        setComissaoPadrao("");
      }
    } catch (err) {
      setComissaoMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Erro ao carregar a comissão.",
      });
    } finally {
      setComissaoLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadComissaoPadrao();
  }, [loadComissaoPadrao]);

  const saveComissaoPadrao = async () => {
    const valor = Number(comissaoPadrao.replace(",", ".").trim());
    if (!Number.isFinite(valor) || valor < 0) {
      setComissaoMessage({
        type: "error",
        text: "Indique uma comissão padrão válida (número ≥ 0).",
      });
      return;
    }

    setComissaoSaving(true);
    setComissaoMessage(null);

    try {
      const res = await fetch("/api/comissao", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor,
          id: comissaoDocId,
        }),
      });
      const data = (await res.json()) as {
        record?: { id: string; valor: number };
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error ?? "Não foi possível guardar a comissão.");
      }

      if (data.record) {
        setComissaoDocId(data.record.id);
        setComissaoPadrao(String(data.record.valor));
      }

      setComissaoMessage({
        type: "success",
        text: comissaoDocId
          ? "Comissão padrão atualizada."
          : "Comissão padrão registada.",
      });
    } catch (err) {
      setComissaoMessage({
        type: "error",
        text:
          err instanceof Error ? err.message : "Erro ao guardar a comissão.",
      });
    } finally {
      setComissaoSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <WhiteCard>
          <CardTitle>Comissões da Plataforma</CardTitle>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Comissão Padrão (%)
              </label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex.: 15"
                value={comissaoPadrao}
                onChange={(e) => setComissaoPadrao(e.target.value)}
                disabled={comissaoLoading || comissaoSaving}
                className={inputClass()}
              />
              <p className="mt-1 text-xs text-pika-muted">
                Valor mais recente da coleção comissao — porcentagem cobrada em
                cada corrida
              </p>
              {comissaoMessage ? (
                <p
                  className={cn(
                    "mt-2 text-xs font-medium",
                    comissaoMessage.type === "error"
                      ? "text-red-600"
                      : "text-emerald-700",
                  )}
                >
                  {comissaoMessage.text}
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => void saveComissaoPadrao()}
                disabled={comissaoLoading || comissaoSaving}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faFloppyDisk} className="h-4 w-4" />
                {comissaoSaving
                  ? "A guardar…"
                  : comissaoDocId
                    ? "Atualizar comissão"
                    : "Registar comissão"}
              </button>
            </div>
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Comissão Premium (%)
              </label>
              <input type="text" placeholder="Ex.: 18" className={inputClass()} />
              <p className="mt-1 text-xs text-pika-muted">
                Para corridas premium/executivo
              </p>
            </div>
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Comissão Entregas (%)
              </label>
              <input type="text" placeholder="Ex.: 12" className={inputClass()} />
              <p className="mt-1 text-xs text-pika-muted">
                Para serviços de entrega
              </p>
            </div>
          </div>
        </WhiteCard>

        <WhiteCard>
          <CardTitle>Tarifas de Corrida</CardTitle>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Tarifa Base (Kz)
              </label>
              <input
                type="text"
                placeholder="0"
                value={tarifaBase}
                onChange={(e) => setTarifaBase(e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Tarifa por KM (Kz)
              </label>
              <input
                type="text"
                placeholder="0"
                value={tarifaPorKm}
                onChange={(e) => setTarifaPorKm(e.target.value)}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Tarifa por Minuto (Kz)
              </label>
              <input type="text" placeholder="0" className={inputClass()} />
            </div>
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Tarifa Mínima (Kz)
              </label>
              <input type="text" placeholder="0" className={inputClass()} />
            </div>
          </div>
        </WhiteCard>
      </div>

      <PriceSimulatorCard tarifaBase={tarifaBase} tarifaPorKm={tarifaPorKm} />

      <WhiteCard>
        <CardTitle>Multiplicadores Dinâmicos</CardTitle>
        <div className="mt-5 grid gap-6 md:grid-cols-3">
          <div>
            <label className="text-sm font-semibold text-pika-ink">
              Multiplicador Horário de Pico
            </label>
            <input type="text" placeholder="1.0" className={inputClass()} />
            <p className="mt-1 text-xs text-pika-muted">7h-9h e 17h-20h</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-pika-ink">
              Multiplicador Madrugada
            </label>
            <input type="text" placeholder="1.0" className={inputClass()} />
            <p className="mt-1 text-xs text-pika-muted">23h-5h</p>
          </div>
          <div>
            <label className="text-sm font-semibold text-pika-ink">
              Multiplicador Alta Demanda
            </label>
            <input type="text" placeholder="1.0" className={inputClass()} />
            <p className="mt-1 text-xs text-pika-muted">
              Quando demanda excede oferta
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end border-t border-pika-border pt-5">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-pika-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="h-4 w-4" />
            Salvar Alterações
          </button>
        </div>
      </WhiteCard>
    </div>
  );
}

function UsersTab() {
  return (
    <WhiteCard>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-pika-ink">
            Usuários Administrativos
          </h2>
          <p className="mt-1 text-sm text-pika-muted">
            Gerencie o acesso ao painel
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-pika-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark sm:self-auto"
        >
          + Novo Usuário
        </button>
      </div>

      <div className="overflow-x-auto scroll-pika rounded-xl border border-pika-border">
        <table className="min-w-[720px] w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-pika-border bg-pika-page/90 text-xs font-semibold uppercase tracking-wide text-pika-muted">
              <th className="px-4 py-3">Usuário</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Função</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {ADMIN_USERS.map((u, idx) => (
              <tr
                key={u.id}
                className={cn(
                  "border-b border-pika-border transition-colors last:border-b-0",
                  idx === 2 ? "bg-pika-page/90" : "bg-pika-card hover:bg-pika-page/80",
                )}
              >
                <td className="px-4 py-4 font-semibold text-pika-ink">{u.name}</td>
                <td className="px-4 py-4 text-pika-muted">{u.email}</td>
                <td className="px-4 py-4 text-pika-ink">{u.role}</td>
                <td className="px-4 py-4">
                  <span
                    className={cn(
                      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
                      u.active
                        ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100"
                        : "bg-red-50 text-red-700 ring-1 ring-red-100",
                    )}
                  >
                    {u.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="inline-flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-pika-ink transition hover:bg-pika-page"
                      aria-label="Editar"
                    >
                      <FontAwesomeIcon icon={faPen} className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                      aria-label="Eliminar"
                    >
                      <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WhiteCard>
  );
}

function NotificationsTab({
  notifNewRide,
  setNotifNewRide,
  notifCancelled,
  setNotifCancelled,
  notifDriverIssue,
  setNotifDriverIssue,
  notifAppUpdates1,
  setNotifAppUpdates1,
  notifAppUpdates2,
  setNotifAppUpdates2,
  notifGeneral,
  setNotifGeneral,
  ids,
}: {
  notifNewRide: boolean;
  setNotifNewRide: (v: boolean) => void;
  notifCancelled: boolean;
  setNotifCancelled: (v: boolean) => void;
  notifDriverIssue: boolean;
  setNotifDriverIssue: (v: boolean) => void;
  notifAppUpdates1: boolean;
  setNotifAppUpdates1: (v: boolean) => void;
  notifAppUpdates2: boolean;
  setNotifAppUpdates2: (v: boolean) => void;
  notifGeneral: boolean;
  setNotifGeneral: (v: boolean) => void;
  ids: string[];
}) {
  const rows = [
    {
      id: ids[0],
      title: "Nova Corrida Solicitada",
      desc: "Receber alerta para cada nova corrida",
      checked: notifNewRide,
      set: setNotifNewRide,
    },
    {
      id: ids[1],
      title: "Corrida Cancelada",
      desc: "Notificar quando uma corrida for cancelada",
      checked: notifCancelled,
      set: setNotifCancelled,
    },
    {
      id: ids[2],
      title: "Problema com Motorista",
      desc: "Alerta de Incidentes Reportados",
      checked: notifDriverIssue,
      set: setNotifDriverIssue,
    },
    {
      id: ids[3],
      title: "Atualizações do aplicativo",
      desc: "Atualizações do aplicativo",
      checked: notifAppUpdates1,
      set: setNotifAppUpdates1,
    },
    {
      id: ids[4],
      title: "Atualizações do aplicativo",
      desc: "Atualizações do aplicativo",
      checked: notifAppUpdates2,
      set: setNotifAppUpdates2,
    },
    {
      id: ids[5],
      title: "Notificações gerais",
      desc: "Notificações gerais",
      checked: notifGeneral,
      set: setNotifGeneral,
    },
  ];

  return (
    <WhiteCard>
      <h2 className="text-lg font-bold text-pika-ink">Preferências de Notificação</h2>
      <div className="mt-2 divide-y divide-pika-border">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center justify-between gap-4 py-4 first:pt-2"
          >
            <div className="min-w-0">
              <p id={row.id} className="font-semibold text-pika-ink">
                {row.title}
              </p>
              <p className="mt-1 text-sm text-pika-muted">{row.desc}</p>
            </div>
            <SettingsSwitch
              checked={row.checked}
              onChange={row.set}
              labelledBy={row.id}
            />
          </div>
        ))}
      </div>
      <div className="mt-6 flex justify-end border-t border-pika-border pt-5">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-pika-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark"
        >
          <FontAwesomeIcon icon={faFloppyDisk} className="h-4 w-4" />
          Salvar Preferências
        </button>
      </div>
    </WhiteCard>
  );
}

function RulesTab({
  secDocs,
  setSecDocs,
  secPhoto,
  setSecPhoto,
  secShare,
  setSecShare,
  secAudio,
  setSecAudio,
  ids,
}: {
  secDocs: boolean;
  setSecDocs: (v: boolean) => void;
  secPhoto: boolean;
  setSecPhoto: (v: boolean) => void;
  secShare: boolean;
  setSecShare: (v: boolean) => void;
  secAudio: boolean;
  setSecAudio: (v: boolean) => void;
  ids: string[];
}) {
  const placeholder = "Text placeholder";
  const securityRows = [
    {
      id: ids[0],
      title: "Verificação de documentos obrigatória",
      desc: "Motoristas devem ter documentos verificados",
      checked: secDocs,
      set: setSecDocs,
    },
    {
      id: ids[1],
      title: "Foto de perfil obrigatória",
      desc: "Todos os usuários devem ter foto",
      checked: secPhoto,
      set: setSecPhoto,
    },
    {
      id: ids[2],
      title: "Permitir compartilhamento de viagem",
      desc: "Passageiros podem compartilhar localização",
      checked: secShare,
      set: setSecShare,
    },
    {
      id: ids[3],
      title: "Gravação de áudio nas corridas",
      desc: "Habilitar gravação para segurança",
      checked: secAudio,
      set: setSecAudio,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <WhiteCard>
          <CardTitle>Regras de Cancelamento</CardTitle>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Tempo para cancelamento gratuito (min)
              </label>
              <input
                type="text"
                defaultValue={placeholder}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Taxa de Cancelamento (Kz)
              </label>
              <input
                type="text"
                defaultValue={placeholder}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Limite de Cancelamento por Dia
              </label>
              <input
                type="text"
                defaultValue={placeholder}
                className={inputClass()}
              />
            </div>
          </div>
        </WhiteCard>

        <WhiteCard>
          <CardTitle>Regras de Motoristas</CardTitle>
          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Avaliação Mínima
              </label>
              <input
                type="text"
                defaultValue={placeholder}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Horas Máximas por Dia
              </label>
              <input
                type="text"
                defaultValue={placeholder}
                className={inputClass()}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-pika-ink">
                Idade Máxima do Veículo (anos)
              </label>
              <input
                type="text"
                defaultValue={placeholder}
                className={inputClass()}
              />
            </div>
          </div>
        </WhiteCard>
      </div>

      <WhiteCard>
        <CardTitle>Configurações de Segurança</CardTitle>
        <div className="mt-2 divide-y divide-pika-border">
          {securityRows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-4 py-4 first:pt-2"
            >
              <div className="min-w-0">
                <p id={row.id} className="font-semibold text-pika-ink">
                  {row.title}
                </p>
                <p className="mt-1 text-sm text-pika-muted">{row.desc}</p>
              </div>
              <SettingsSwitch
                checked={row.checked}
                onChange={row.set}
                labelledBy={row.id}
              />
            </div>
          ))}
        </div>
      </WhiteCard>

      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl bg-pika-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-pika-primary-dark"
        >
          <FontAwesomeIcon icon={faFloppyDisk} className="h-4 w-4" />
          Salvar Configurações
        </button>
      </div>
    </div>
  );
}

