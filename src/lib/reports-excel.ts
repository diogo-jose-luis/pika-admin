import ExcelJS from "exceljs";
import { formatKz } from "@/lib/format-kz";
import {
  summaryRowsForDisplay,
  type ReportPeriodData,
} from "@/lib/reports-data";
import { REPORT_TYPES, type ReportTypeId } from "@/lib/reports-meta";
import { formatGeneratedAt } from "@/lib/reports-period";

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFF96100" },
};

function styleHeaderRow(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = HEADER_FILL;
  row.alignment = { vertical: "middle", horizontal: "center" };
  row.height = 22;
}

function addMetaSheet(
  workbook: ExcelJS.Workbook,
  title: string,
  data: ReportPeriodData,
  exportedBy: string,
) {
  const sheet = workbook.addWorksheet("Informação", {
    views: [{ state: "frozen", ySplit: 1 }],
  });
  sheet.columns = [
    { header: "Campo", key: "field", width: 28 },
    { header: "Valor", key: "value", width: 48 },
  ];
  styleHeaderRow(sheet.getRow(1));

  const rows = [
    ["Relatório", title],
    ["Período", data.periodLabel],
    ["Exportado por", exportedBy],
    ["Gerado em", formatGeneratedAt()],
    ["Total corridas", String(data.summary.totalRides)],
    ["Concluídas", String(data.summary.completed)],
    ["Receita", formatKz(data.summary.totalRevenue)],
  ];

  for (const [field, value] of rows) {
    sheet.addRow({ field, value });
  }
}

function addRidesSheet(workbook: ExcelJS.Workbook, data: ReportPeriodData) {
  const sheet = workbook.addWorksheet("Corridas");
  sheet.columns = [
    { header: "ID", key: "id", width: 22 },
    { header: "Data", key: "date", width: 18 },
    { header: "Passageiro", key: "passenger", width: 22 },
    { header: "Motorista", key: "driver", width: 22 },
    { header: "Origem", key: "origin", width: 28 },
    { header: "Destino", key: "destination", width: 28 },
    { header: "Estado", key: "status", width: 14 },
    { header: "Valor (Kz)", key: "price", width: 14 },
    { header: "Comissão (Kz)", key: "commission", width: 14 },
  ];
  styleHeaderRow(sheet.getRow(1));

  for (const r of data.rides) {
    sheet.addRow({
      id: r.id,
      date: r.dateLabel,
      passenger: r.passenger,
      driver: r.driver,
      origin: r.origin,
      destination: r.destination,
      status: r.status,
      price: r.price,
      commission: r.commission,
    });
  }
}

function addDriversSheet(workbook: ExcelJS.Workbook, data: ReportPeriodData) {
  const sheet = workbook.addWorksheet("Motoristas");
  sheet.columns = [
    { header: "Motorista", key: "name", width: 26 },
    { header: "Concluídas", key: "completed", width: 12 },
    { header: "Canceladas", key: "cancelled", width: 12 },
    { header: "Em andamento", key: "inProgress", width: 14 },
    { header: "Receita (Kz)", key: "revenue", width: 16 },
    { header: "Comissão (Kz)", key: "commission", width: 16 },
    { header: "Avaliação média", key: "rating", width: 14 },
  ];
  styleHeaderRow(sheet.getRow(1));

  for (const d of data.drivers) {
    sheet.addRow({
      name: d.name,
      completed: d.completedRides,
      cancelled: d.cancelledRides,
      inProgress: d.inProgressRides,
      revenue: d.revenue,
      commission: d.commission,
      rating: d.avgRating ?? "",
    });
  }
}

function addTrendSheet(workbook: ExcelJS.Workbook, data: ReportPeriodData) {
  const sheet = workbook.addWorksheet("Tendências");
  sheet.columns = [
    { header: "Dia", key: "day", width: 8 },
    { header: "Corridas", key: "rides", width: 12 },
    { header: "Concluídas", key: "completed", width: 12 },
    { header: "Receita (Kz)", key: "revenue", width: 16 },
  ];
  styleHeaderRow(sheet.getRow(1));

  for (const d of data.dailyTrend) {
    sheet.addRow({
      day: d.label,
      rides: d.rides,
      completed: d.completed,
      revenue: d.revenue,
    });
  }

  sheet.addRow({});
  sheet.addRow({ day: "Mês anterior", rides: data.previousMonth.totalRides });
  sheet.addRow({
    day: "Receita mês ant.",
    revenue: data.previousMonth.totalRevenue,
  });
}

function addSummarySheet(workbook: ExcelJS.Workbook, data: ReportPeriodData) {
  const sheet = workbook.addWorksheet("Resumo");
  sheet.columns = [
    { header: "Indicador", key: "label", width: 28 },
    { header: "Valor", key: "value", width: 24 },
  ];
  styleHeaderRow(sheet.getRow(1));
  for (const [label, value] of summaryRowsForDisplay(data.summary)) {
    sheet.addRow({ label, value });
  }
}

export async function buildReportExcel(
  type: ReportTypeId,
  data: ReportPeriodData,
  exportedBy: string,
): Promise<Buffer> {
  const title = REPORT_TYPES.find((t) => t.id === type)?.title ?? "Relatório";
  const workbook = new ExcelJS.Workbook();
  workbook.creator = exportedBy;
  workbook.created = new Date();

  addMetaSheet(workbook, title, data, exportedBy);
  addSummarySheet(workbook, data);

  switch (type) {
    case "financeiro":
      addTrendSheet(workbook, data);
      addDriversSheet(workbook, data);
      addRidesSheet(workbook, data);
      break;
    case "corridas":
      addRidesSheet(workbook, data);
      break;
    case "motoristas":
      addDriversSheet(workbook, data);
      addRidesSheet(workbook, data);
      break;
    case "tendencias":
      addTrendSheet(workbook, data);
      break;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
