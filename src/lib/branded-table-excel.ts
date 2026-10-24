import fs from "node:fs";
import ExcelJS from "exceljs";
import { logoPath, type BrandedTableDocument } from "@/lib/branded-export";

const ORANGE = "FFF96100";
const INK = "FF2D3436";
const MUTED = "FF636E72";
const WHITE = "FFFFFFFF";
const CREAM = "FFFFF8F4";
const ZEBRA = "FFFFF6F0";
const LINE = "FFE6DFD8";

const thinBorder: ExcelJS.Border = {
  style: "thin",
  color: { argb: LINE },
};

function fill(argb: string): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function sheetName(title: string): string {
  const cleaned = title.replace(/[\\/*?:[\]]/g, " ").trim() || "PIKA";
  return cleaned.slice(0, 31);
}

export async function buildBrandedTableExcel(
  docData: BrandedTableDocument,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PIKA";
  workbook.company = "PIKA";
  workbook.created = new Date();
  workbook.title = docData.title;

  const columnCount = Math.max(docData.columns.length, 1);
  const sheet = workbook.addWorksheet(sheetName(docData.title), {
    views: [{ state: "frozen", ySplit: 4, showGridLines: false }],
    pageSetup: {
      paperSize: 9,
      orientation: columnCount > 5 ? "landscape" : "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      printTitlesRow: "1:4",
      margins: {
        left: 0.4,
        right: 0.4,
        top: 0.7,
        bottom: 0.55,
        header: 0.25,
        footer: 0.25,
      },
    },
    headerFooter: {
      oddHeader: `&L&B&K${ORANGE.slice(2)}PIKA&C&K${INK.slice(2)}${docData.title.replace(/&/g, " ")}&R&K${MUTED.slice(2)}&D`,
      oddFooter: `&L&K${MUTED.slice(2)}PIKA  |  pika.ao&C&K${MUTED.slice(2)}Exportado por ${docData.exportedBy.replace(/&/g, " ")}&R&K${MUTED.slice(2)}Página &P de &N`,
    },
  });

  for (let index = 1; index <= columnCount; index++) {
    const label = docData.columns[index - 1] ?? "";
    const sample = docData.rows.slice(0, 40).reduce((max, row) => {
      return Math.max(max, String(row[index - 1] ?? "").length);
    }, label.length);
    sheet.getColumn(index).width = Math.min(42, Math.max(14, sample + 2));
  }

  sheet.mergeCells(1, 1, 1, columnCount);
  sheet.mergeCells(2, 1, 2, columnCount);
  sheet.mergeCells(3, 1, 3, columnCount);

  const logo = logoPath();
  const brand = sheet.getRow(1);
  brand.height = 34;
  brand.getCell(1).value = "PIKA";
  brand.getCell(1).font = {
    name: "Calibri",
    bold: true,
    size: 20,
    color: { argb: WHITE },
  };
  brand.getCell(1).fill = fill(ORANGE);
  brand.getCell(1).alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: logo ? 8 : 1,
  };

  if (logo && fs.existsSync(logo)) {
    const imageId = workbook.addImage({
      base64: fs.readFileSync(logo).toString("base64"),
      extension: "png",
    });
    sheet.addImage(imageId, {
      tl: { col: 0.15, row: 0.12 },
      ext: { width: 78, height: 26 },
      editAs: "oneCell",
    });
  }

  const titleRow = sheet.getRow(2);
  titleRow.height = 22;
  titleRow.getCell(1).value = docData.title;
  titleRow.getCell(1).font = {
    name: "Calibri",
    bold: true,
    size: 14,
    color: { argb: INK },
  };
  titleRow.getCell(1).fill = fill(CREAM);
  titleRow.getCell(1).alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 1,
  };

  const metaRow = sheet.getRow(3);
  metaRow.height = 18;
  metaRow.getCell(1).value = `${docData.rows.length} registos  |  ${docData.generatedAt}  |  Exportado por ${docData.exportedBy}`;
  metaRow.getCell(1).font = {
    name: "Calibri",
    size: 10,
    color: { argb: MUTED },
  };
  metaRow.getCell(1).fill = fill(CREAM);
  metaRow.getCell(1).alignment = {
    vertical: "middle",
    horizontal: "left",
    indent: 1,
  };

  const header = sheet.getRow(4);
  header.height = 22;
  docData.columns.forEach((label, index) => {
    const cell = header.getCell(index + 1);
    cell.value = label;
    cell.font = { name: "Calibri", bold: true, size: 11, color: { argb: WHITE } };
    cell.fill = fill(ORANGE);
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: thinBorder,
      left: thinBorder,
      bottom: thinBorder,
      right: thinBorder,
    };
  });

  docData.rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(rowIndex + 5);
    excelRow.height = 18;
    docData.columns.forEach((_, columnIndex) => {
      const cell = excelRow.getCell(columnIndex + 1);
      cell.value = row[columnIndex] ?? "";
      cell.font = { name: "Calibri", size: 10, color: { argb: INK } };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cell.border = {
        top: thinBorder,
        left: thinBorder,
        bottom: thinBorder,
        right: thinBorder,
      };
      if (rowIndex % 2 === 1) cell.fill = fill(ZEBRA);
    });
  });

  if (docData.rows.length > 0) {
    sheet.autoFilter = {
      from: { row: 4, column: 1 },
      to: { row: 4 + docData.rows.length, column: columnCount },
    };
  }

  const raw = await workbook.xlsx.writeBuffer();
  return Buffer.from(raw);
}
