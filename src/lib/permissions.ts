import {
  NIVEL_ADMIN,
  NIVEL_FINANCEIRO,
  NIVEL_OPERADOR,
  NIVEL_SUPER_ADMIN,
} from "@/lib/auth-types";
import type { NavItem } from "@/lib/nav";

export type SettingsTabId = "fees" | "users" | "notifications" | "rules" | "prices";

const OPERADOR_PATHS = new Set([
  "/dashboard",
  "/mapa-ao-vivo",
  "/historico-corridas",
  "/motoristas",
  "/passageiros",
  "/sos",
]);

const FINANCEIRO_PATHS = new Set(["/financeiro", "/financeiro/transacoes"]);

const ADMIN_PATHS = new Set([
  "/dashboard",
  "/historico-corridas",
  "/motoristas",
  "/passageiros",
  "/mapa-ao-vivo",
  "/relatorios",
  "/modelo-viaturas",
  "/validacao-motoristas",
  "/sos",
  "/configuracoes",
]);

function pathMatches(pathname: string, allowed: Set<string>): boolean {
  if (allowed.has(pathname)) return true;
  for (const base of allowed) {
    if (pathname.startsWith(`${base}/`)) return true;
  }
  return false;
}

export function canAccessPath(nivel: number, pathname: string): boolean {
  if (nivel >= NIVEL_SUPER_ADMIN) return true;

  if (nivel >= NIVEL_ADMIN) {
    return pathMatches(pathname, ADMIN_PATHS);
  }

  if (nivel === NIVEL_FINANCEIRO) {
    return pathMatches(pathname, FINANCEIRO_PATHS);
  }

  if (nivel === NIVEL_OPERADOR) {
    return pathMatches(pathname, OPERADOR_PATHS);
  }

  return false;
}

export function filterSidebarNav(nivel: number, items: NavItem[]): NavItem[] {
  return items.filter((item) => canAccessPath(nivel, item.href));
}

export function canManageAdminUsers(nivel: number): boolean {
  return nivel >= NIVEL_SUPER_ADMIN;
}

/** Remover alertas SOS (Admin e Super Admin). */
export function canDeleteSos(nivel: number): boolean {
  return nivel >= NIVEL_ADMIN;
}

/** Receita total e receita semanal no dashboard (ocultas para operador). */
export function canViewDashboardRevenue(nivel: number): boolean {
  return nivel >= NIVEL_ADMIN;
}

export function canAccessSettingsTab(
  nivel: number,
  tab: SettingsTabId,
): boolean {
  if (nivel >= NIVEL_SUPER_ADMIN) return true;
  if (nivel >= NIVEL_ADMIN) {
    return tab !== "users";
  }
  return false;
}

export function filterSettingsTabs<T extends { id: SettingsTabId }>(
  nivel: number,
  tabs: T[],
): T[] {
  return tabs.filter((t) => canAccessSettingsTab(nivel, t.id));
}

/** Rota inicial após login conforme o nível. */
export function defaultRouteForNivel(nivel: number): string {
  if (nivel === NIVEL_FINANCEIRO) return "/financeiro";
  return "/dashboard";
}

/** Primeira rota acessível quando o utilizador não tem permissão na página atual. */
export function fallbackRouteForNivel(nivel: number): string {
  const preferred = defaultRouteForNivel(nivel);
  if (canAccessPath(nivel, preferred)) return preferred;

  const candidates = [
    "/dashboard",
    "/mapa-ao-vivo",
    "/financeiro",
    "/historico-corridas",
    "/motoristas",
    "/sos",
  ];

  const found = candidates.find((p) => canAccessPath(nivel, p));
  return found ?? "/login";
}
