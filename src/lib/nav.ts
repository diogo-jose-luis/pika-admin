export type NavItem = {
  label: string;
  href: string;
  /** Nome do SVG em `public/font-awesome` (sem extensão). */
  icon: string;
  /** Ícone sobreposto (ex.: check dentro do escudo). */
  iconOverlay?: string;
};

/** Ícones alinhados ao protótipo — SVGs em `public/font-awesome/`. */
export const sidebarNav: NavItem[] = [
  { label: "Visão Geral", href: "/dashboard", icon: "th-large" },
  { label: "Histórico de Corridas", href: "/historico-corridas", icon: "history" },
  { label: "Motoristas", href: "/motoristas", icon: "user-circle" },
  { label: "Passageiros", href: "/passageiros", icon: "male" },
  { label: "Financeiro", href: "/financeiro", icon: "money" },
  { label: "Mapa ao vivo", href: "/mapa-ao-vivo", icon: "map" },
  { label: "Relatórios", href: "/relatorios", icon: "file-text" },
  { label: "Modelo de Viaturas", href: "/modelo-viaturas", icon: "automobile" },
  {
    label: "Validação Motoristas",
    href: "/validacao-motoristas",
    icon: "shield",
    iconOverlay: "check",
  },
  { label: "Alteração de Dados", href: "/alterar-dados", icon: "pencil-square" },
  { label: "SOS", href: "/sos", icon: "exclamation-triangle" },
  { label: "Configurações", href: "/configuracoes", icon: "cog" },
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
  "/alterar-dados": {
    title: "Alteração de Dados",
    subtitle: "Aprove ou rejeite pedidos de atualização de perfil",
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
