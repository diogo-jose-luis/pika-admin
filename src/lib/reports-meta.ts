export type ReportTypeId =
  | "financeiro"
  | "corridas"
  | "motoristas"
  | "tendencias";

export type ReportFormat = "pdf" | "excel";

export type ReportTypeMeta = {
  id: ReportTypeId;
  title: string;
  description: string;
  iconTone: string;
};

export const REPORT_TYPES: ReportTypeMeta[] = [
  {
    id: "financeiro",
    title: "Relatório Financeiro",
    description: "Análise completa de todas as corridas do período",
    iconTone: "bg-emerald-500",
  },
  {
    id: "corridas",
    title: "Relatório de Corridas",
    description: "Análise completa de todas as corridas do período",
    iconTone: "bg-teal-700",
  },
  {
    id: "motoristas",
    title: "Relatório de Motoristas",
    description: "Performance e métricas dos motoristas",
    iconTone: "bg-amber-400",
  },
  {
    id: "tendencias",
    title: "Análise de Tendências",
    description: "Comparativos e projeções de crescimento",
    iconTone: "bg-blue-600",
  },
];

export const REPORT_FORMAT_OPTIONS: { value: ReportFormat; label: string }[] = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
];

export function reportFilename(
  type: ReportTypeId,
  format: ReportFormat,
  year: number,
  month: number,
): string {
  const mm = String(month).padStart(2, "0");
  const ext = format === "pdf" ? "pdf" : "xlsx";
  return `relatorio-${type}-${year}-${mm}.${ext}`;
}
