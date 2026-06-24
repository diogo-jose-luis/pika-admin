import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { formatKz } from "@/lib/format-kz";
import {
  summaryRowsForDisplay,
  type ReportPeriodData,
} from "@/lib/reports-data";
import { REPORT_TYPES, type ReportTypeId } from "@/lib/reports-meta";
import { formatGeneratedAt } from "@/lib/reports-period";

type PdfDoc = InstanceType<typeof PDFDocument>;

const MARGIN = 48;
const PRIMARY = "#f96100";
const INK = "#2d3436";
const MUTED = "#636e72";
const LINE = "#d8e0de";

/** Fontes standard PDF (WinAnsi) — remove caracteres que quebram o pdfkit. */
function pdfSafeText(value: string): string {
  return value
    .replace(/\u2014/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2192/g, "->")
    .replace(/[\u00A0\u202F]/g, " ")
    .replace(/[^\t\n\r\x20-\x7E\xA0-\xFF]/g, "");
}

function logoPath(): string {
  const candidates = [
    path.join(process.cwd(), "public", "logo.png"),
    path.join(process.cwd(), "public", "pika.png"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? candidates[0]!;
}

function drawHeader(
  doc: PdfDoc,
  title: string,
  periodLabel: string,
) {
  const logo = logoPath();
  if (fs.existsSync(logo)) {
    try {
      doc.image(logo, MARGIN, MARGIN, { width: 110 });
    } catch {
      /* logo opcional — não falha o relatório */
    }
  }

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(INK)
    .text(pdfSafeText(title), MARGIN + 125, MARGIN + 4, { width: 380 });

  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(MUTED)
    .text(pdfSafeText(`Periodo: ${periodLabel}`), MARGIN + 125, MARGIN + 30);

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(PRIMARY)
    .text("Pika Admin - Relatorios operacionais", MARGIN + 125, MARGIN + 46);

  const y = MARGIN + 78;
  doc
    .moveTo(MARGIN, y)
    .lineTo(doc.page.width - MARGIN, y)
    .lineWidth(1)
    .strokeColor(LINE)
    .stroke();

  doc.y = y + 18;
}

function drawFooter(
  doc: PdfDoc,
  pageNumber: number,
  exportedBy: string,
  generatedAt: string,
) {
  const footerY = doc.page.height - 36;
  doc
    .moveTo(MARGIN, footerY - 10)
    .lineTo(doc.page.width - MARGIN, footerY - 10)
    .lineWidth(0.5)
    .strokeColor(LINE)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(MUTED)
    .text(pdfSafeText(`Exportado por: ${exportedBy}  |  ${generatedAt}`), MARGIN, footerY, {
      width: doc.page.width - MARGIN * 2,
      align: "left",
    });

  doc.text(pdfSafeText(`Pagina ${pageNumber}`), MARGIN, footerY, {
    width: doc.page.width - MARGIN * 2,
    align: "right",
  });
}

function sectionTitle(doc: PdfDoc, text: string) {
  doc.moveDown(0.5);
  doc.font("Helvetica-Bold").fontSize(12).fillColor(PRIMARY).text(pdfSafeText(text));
  doc.moveDown(0.35);
}

function keyValueGrid(doc: PdfDoc, rows: string[][]) {
  doc.font("Helvetica").fontSize(10).fillColor(INK);
  for (const [label, value] of rows) {
    doc
      .font("Helvetica-Bold")
      .text(`${pdfSafeText(label)}: `, { continued: true })
      .font("Helvetica")
      .text(pdfSafeText(value));
  }
  doc.moveDown(0.5);
}

function drawTable(
  doc: PdfDoc,
  headers: string[],
  rows: string[][],
  colWidths: number[],
) {
  const startX = MARGIN;
  const rowHeight = 20;
  let y = doc.y;

  const drawRow = (cells: string[], bold = false) => {
    if (y > doc.page.height - MARGIN - 60) {
      doc.addPage();
      y = MARGIN;
    }
    let x = startX;
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(9).fillColor(INK);
    for (let i = 0; i < cells.length; i++) {
      doc.text(pdfSafeText(cells[i] ?? ""), x + 4, y + 5, {
        width: (colWidths[i] ?? 80) - 8,
        ellipsis: true,
      });
      x += colWidths[i] ?? 80;
    }
    doc
      .rect(startX, y, colWidths.reduce((a, b) => a + b, 0), rowHeight)
      .strokeColor(LINE)
      .lineWidth(0.5)
      .stroke();
    y += rowHeight;
  };

  drawRow(headers, true);
  for (const row of rows) {
    drawRow(row);
  }
  doc.y = y + 8;
}

function renderFinanceiro(doc: PdfDoc, data: ReportPeriodData) {
  sectionTitle(doc, "Resumo financeiro");
  keyValueGrid(doc, summaryRowsForDisplay(data.summary));

  sectionTitle(doc, "Receita por dia");
  drawTable(
    doc,
    ["Dia", "Corridas", "Concluídas", "Receita"],
    data.dailyTrend.map((d) => [
      d.label,
      String(d.rides),
      String(d.completed),
      formatKz(d.revenue),
    ]),
    [60, 80, 90, 120],
  );

  sectionTitle(doc, "Top motoristas por receita");
  drawTable(
    doc,
    ["Motorista", "Corridas", "Receita", "Comissão"],
    data.drivers.slice(0, 15).map((d) => [
      d.name,
      String(d.completedRides),
      formatKz(d.revenue),
      formatKz(d.commission),
    ]),
    [140, 70, 100, 100],
  );
}

function renderCorridas(doc: PdfDoc, data: ReportPeriodData) {
  sectionTitle(doc, "Resumo do período");
  keyValueGrid(doc, summaryRowsForDisplay(data.summary));

  sectionTitle(doc, "Detalhe das corridas");
  const rows = data.rides.slice(0, 80).map((r) => [
    r.dateLabel.split(" ")[0] ?? r.dateLabel,
    r.passenger.slice(0, 18),
    r.driver.slice(0, 18),
    r.status,
    formatKz(r.price),
  ]);
  drawTable(
    doc,
    ["Data", "Passageiro", "Motorista", "Estado", "Valor"],
    rows,
    [70, 95, 95, 75, 80],
  );
  if (data.rides.length > 80) {
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(
        pdfSafeText(
          `... e mais ${data.rides.length - 80} corridas no Excel completo.`,
        ),
      );
  }
}

function renderMotoristas(doc: PdfDoc, data: ReportPeriodData) {
  sectionTitle(doc, "Resumo");
  keyValueGrid(doc, [
    ["Motoristas com atividade", String(data.drivers.length)],
    ["Corridas no período", String(data.summary.totalRides)],
    ["Receita total", formatKz(data.summary.totalRevenue)],
  ]);

  sectionTitle(doc, "Performance por motorista");
  drawTable(
    doc,
    ["Motorista", "Concl.", "Cancel.", "Andam.", "Receita", "Aval."],
    data.drivers.map((d) => [
      d.name,
      String(d.completedRides),
      String(d.cancelledRides),
      String(d.inProgressRides),
      formatKz(d.revenue),
      d.avgRating != null ? String(d.avgRating) : "-",
    ]),
    [120, 45, 50, 55, 85, 40],
  );
}

function renderTendencias(doc: PdfDoc, data: ReportPeriodData) {
  sectionTitle(doc, "Comparativo com mês anterior");
  const revGrowth =
    data.growth.revenuePct != null
      ? `${data.growth.revenuePct >= 0 ? "+" : ""}${data.growth.revenuePct.toFixed(1)}%`
      : "-";
  const ridesGrowth =
    data.growth.ridesPct != null
      ? `${data.growth.ridesPct >= 0 ? "+" : ""}${data.growth.ridesPct.toFixed(1)}%`
      : "-";

  keyValueGrid(doc, [
    ["Mês atual", data.periodLabel],
    ["Mês anterior", data.previousMonth.periodLabel],
    ["Receita atual", formatKz(data.summary.totalRevenue)],
    ["Receita mês anterior", formatKz(data.previousMonth.totalRevenue)],
    ["Variação receita", revGrowth],
    ["Corridas atual", String(data.summary.totalRides)],
    ["Corridas mês anterior", String(data.previousMonth.totalRides)],
    ["Variação corridas", ridesGrowth],
  ]);

  sectionTitle(doc, "Evolução diária");
  drawTable(
    doc,
    ["Dia", "Corridas", "Concluídas", "Receita"],
    data.dailyTrend.map((d) => [
      d.label,
      String(d.rides),
      String(d.completed),
      formatKz(d.revenue),
    ]),
    [60, 80, 90, 120],
  );

  const avgDaily =
    data.dailyTrend.length > 0
      ? data.summary.totalRevenue / data.dailyTrend.length
      : 0;
  doc.moveDown(0.5);
  doc
    .font("Helvetica")
    .fontSize(10)
    .fillColor(MUTED)
    .text(
      pdfSafeText(
        `Projecao simples (media diaria x dias do mes): ${formatKz(avgDaily * data.dailyTrend.length)} com base na receita de corridas concluidas.`,
      ),
    );
}

export async function buildReportPdf(
  type: ReportTypeId,
  data: ReportPeriodData,
  exportedBy: string,
): Promise<Buffer> {
  const title = REPORT_TYPES.find((t) => t.id === type)?.title ?? "Relatório";
  const generatedAt = formatGeneratedAt();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGIN, size: "A4", bufferPages: true });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawHeader(doc, title, data.periodLabel);

    switch (type) {
      case "financeiro":
        renderFinanceiro(doc, data);
        break;
      case "corridas":
        renderCorridas(doc, data);
        break;
      case "motoristas":
        renderMotoristas(doc, data);
        break;
      case "tendencias":
        renderTendencias(doc, data);
        break;
    }

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      drawFooter(doc, i - range.start + 1, exportedBy, generatedAt);
    }

    doc.end();
  });
}
