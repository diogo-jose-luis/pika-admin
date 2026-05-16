import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faCar,
  faChartLine,
  faChartPie,
  faClipboardCheck,
  faClockRotateLeft,
  faGear,
  faMapLocationDot,
  faTriangleExclamation,
  faUserTie,
  faUsers,
  faWallet,
} from "@fortawesome/free-solid-svg-icons";

export type NavItem = {
  label: string;
  href: string;
  icon: IconDefinition;
};

export const sidebarNav: NavItem[] = [
  { label: "Visão Geral", href: "/dashboard", icon: faChartPie },
  { label: "Histórico de Corridas", href: "/historico-corridas", icon: faClockRotateLeft },
  { label: "Motoristas", href: "/motoristas", icon: faUserTie },
  { label: "Passageiros", href: "/passageiros", icon: faUsers },
  { label: "Financeiro", href: "/financeiro", icon: faWallet },
  { label: "Mapa ao vivo", href: "/mapa-ao-vivo", icon: faMapLocationDot },
  { label: "Relatórios", href: "/relatorios", icon: faChartLine },
  { label: "Modelo de Viaturas", href: "/modelo-viaturas", icon: faCar },
  { label: "Validação Motoristas", href: "/validacao-motoristas", icon: faClipboardCheck },
  { label: "SOS", href: "/sos", icon: faTriangleExclamation },
  { label: "Configurações", href: "/configuracoes", icon: faGear },
];

const headerOverrides: Record<string, { title: string; subtitle: string }> = {
  "/historico-corridas": {
    title: "Gestão de Corridas",
    subtitle: "Acompanhe todas as corridas",
  },
  "/passageiros": {
    title: "Gestão de Passageiros",
    subtitle: "Gerencie todos os usuários",
  },
  "/relatorios": {
    title: "Relatórios",
    subtitle: "Visualize corridas e motoristas",
  },
  "/mapa-ao-vivo": {
    title: "Mapa em Tempo Real",
    subtitle: "Visualize corridas e motoristas",
  },
  "/financeiro": {
    title: "Financeiro",
    subtitle: "Acompanhe receitas e pagamentos",
  },
  "/financeiro/transacoes": {
    title: "Transações Recentes",
    subtitle: "Últimas movimentações",
  },
  "/motoristas": {
    title: "Gestão de Motoristas",
    subtitle: "Gerencie todos os motoristas",
  },
  "/modelo-viaturas": {
    title: "Modelos de Viaturas",
    subtitle:
      "Catálogo aprovado para a frota - associe modelos às categorias de corrida",
  },
  "/validacao-motoristas": {
    title: "Validação de Motoristas",
    subtitle: "Acompanhe todas as corridas",
  },
  "/sos": {
    title: "SOS",
    subtitle: "Emergências em tempo real",
  },
  "/configuracoes": {
    title: "Configurações",
    subtitle: "Gerencie as configurações do sistema",
  },
};

export function titleForPath(pathname: string): { title: string; subtitle: string } {
  if (pathname.startsWith("/validacao-motoristas/") && pathname !== "/validacao-motoristas") {
    return {
      title: "Validação de Motoristas",
      subtitle: "Acompanhe todas as corridas",
    };
  }

  const override = headerOverrides[pathname];
  if (override) {
    return override;
  }
  const item = sidebarNav.find((n) => n.href === pathname);
  if (item) {
    return {
      title: item.label,
      subtitle:
        pathname === "/dashboard"
          ? "Bem-vindo ao painel administrativo"
          : "Bem-vindo ao painel administrativo",
    };
  }
  return { title: "Pika", subtitle: "Painel administrativo" };
}
