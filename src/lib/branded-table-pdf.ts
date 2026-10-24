import PDFDocument from "pdfkit";
import {
  logoPath,
  pdfSafeText,
  type BrandedTableDocument,
} from "@/lib/branded-export";

type PdfDoc = InstanceType<typeof PDFDocument>;

const MARGIN_X = 32;
const HEADER_BLOCK = 86;
const FOOTER_BLOCK = 36;
const ORANGE = "#f96100";
const INK = "#2d3436";
const MUTED = "#636e72";
const LINE = "#e6dfd8";
const ZEBRA = "#fff6f0";
const WHITE = "#ffffff";

function drawBrandHeader(doc: PdfDoc, docData: BrandedTableDocument): number {
  const pageWidth = doc.page.width;
  doc.save();
  doc.rect(0, 0, pageWidth, 7).fill(ORANGE);
  doc.restore();

  const logo = logoPath();
  let textX = MARGIN_X;
  if (logo) {
    try {
      doc.image(logo, MARGIN_X, 18, { fit: [70, 28] });
      textX = MARGIN_X + 82;
    } catch {
      textX = MARGIN_X;
    }
  }

  const textWidth = pageWidth - textX - MARGIN_X;

  doc
    .font("Helvetica-Bold")
    .fontSize(11)
    .fillColor(ORANGE)
    .text("PIKA", textX, 16, { width: textWidth, lineBreak: false });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(MUTED)
    .text("Mobilidade urbana", textX, 30, { width: textWidth, lineBreak: false });

  doc
    .font("Helvetica-Bold")
    .fontSize(13)
    .fillColor(INK)
    .text(pdfSafeText(docData.title), textX, 46, {
      width: textWidth,
      height: 16,
      ellipsis: true,
    });

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(MUTED)
    .text(
      pdfSafeText(
        `${docData.rows.length} registos   |   ${docData.generatedAt}`,
      ),
      textX,
      64,
      { width: textWidth, height: 12, ellipsis: true },
    );

  const lineY = HEADER_BLOCK;
  doc
    .moveTo(MARGIN_X, lineY)
    .lineTo(pageWidth - MARGIN_X, lineY)
    .lineWidth(1.4)
    .strokeColor(ORANGE)
    .stroke();

  return lineY + 8;
}

function drawFooter(
  doc: PdfDoc,
  pageNumber: number,
  pageCount: number,
  exportedBy: string,
) {
  const y = doc.page.height - 22;
  const width = doc.page.width - MARGIN_X * 2;

  doc
    .moveTo(MARGIN_X, y - 8)
    .lineTo(doc.page.width - MARGIN_X, y - 8)
    .lineWidth(0.6)
    .strokeColor(LINE)
    .stroke();

  const third = width / 3;
  doc.font("Helvetica").fontSize(8).fillColor(MUTED);
  doc.text("PIKA  |  pika.ao", MARGIN_X, y, {
    width: third,
    height: 12,
    align: "left",
    ellipsis: true,
  });
  doc.text(pdfSafeText(`Exportado por ${exportedBy}`), MARGIN_X + third, y, {
    width: third,
    height: 12,
    align: "center",
    ellipsis: true,
  });
  doc.text(
    pdfSafeText(`Página ${pageNumber} / ${pageCount}`),
    MARGIN_X + third * 2,
    y,
    {
      width: third,
      height: 12,
      align: "right",
      ellipsis: true,
    },
  );
}

function columnWidths(docData: BrandedTableDocument, total: number): number[] {
  const weights = docData.columns.map((label, index) => {
    const sample = docData.rows.slice(0, 20).reduce((max, row) => {
      return Math.max(max, (row[index] ?? "").length);
    }, label.length);
    return Math.max(8, Math.min(40, sample));
  });
  const sum = weights.reduce((totalWeight, weight) => totalWeight + weight, 0) || 1;
  return weights.map((weight) => (weight / sum) * total);
}

export async function buildBrandedTablePdf(
  docData: BrandedTableDocument,
): Promise<Buffer> {
  const landscape = docData.columns.length > 5;
  const fontSize = docData.columns.length > 9 ? 7 : 8;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      layout: landscape ? "landscape" : "portrait",
      margin: 0,
      bufferPages: true,
      info: {
        Title: docData.title,
        Author: "PIKA",
        Creator: "PIKA Admin",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const tableWidth = doc.page.width - MARGIN_X * 2;
    const widths = columnWidths(docData, tableWidth);
    const contentBottom = doc.page.height - FOOTER_BLOCK;

    const paintColumnHeader = (top: number): number => {
      const height = 20;
      doc.save();
      doc.rect(MARGIN_X, top, tableWidth, height).fill(ORANGE);
      doc.restore();
      doc.font("Helvetica-Bold").fontSize(fontSize).fillColor(WHITE);
      let x = MARGIN_X;
      for (let i = 0; i < docData.columns.length; i++) {
        doc.text(pdfSafeText(docData.columns[i] ?? ""), x + 4, top + 6, {
          width: Math.max(8, (widths[i] ?? 40) - 8),
          height: 12,
          ellipsis: true,
        });
        x += widths[i] ?? 40;
      }
      return top + height;
    };

    const openPage = (first: boolean): number => {
      if (!first) doc.addPage();
      const top = drawBrandHeader(doc, docData);
      return paintColumnHeader(top);
    };

    let y = openPage(true);

    const paintRow = (cells: string[], index: number) => {
      doc.font("Helvetica").fontSize(fontSize);
      let rowHeight = 18;
      for (let i = 0; i < cells.length; i++) {
        const measured = doc.heightOfString(pdfSafeText(cells[i] || "-"), {
          width: Math.max(8, (widths[i] ?? 40) - 8),
        });
        rowHeight = Math.max(rowHeight, Math.min(measured + 8, 46));
      }

      if (y + rowHeight > contentBottom) {
        y = openPage(false);
      }

      if (index % 2 === 1) {
        doc.save();
        doc.rect(MARGIN_X, y, tableWidth, rowHeight).fill(ZEBRA);
        doc.restore();
      }

      doc
        .rect(MARGIN_X, y, tableWidth, rowHeight)
        .lineWidth(0.4)
        .strokeColor(LINE)
        .stroke();

      let x = MARGIN_X;
      doc.font("Helvetica").fontSize(fontSize).fillColor(INK);
      for (let i = 0; i < cells.length; i++) {
        const colWidth = widths[i] ?? 40;
        doc.text(pdfSafeText(cells[i] || "-"), x + 4, y + 4, {
          width: Math.max(8, colWidth - 8),
          height: rowHeight - 6,
          ellipsis: true,
        });
        if (i < cells.length - 1) {
          doc
            .moveTo(x + colWidth, y)
            .lineTo(x + colWidth, y + rowHeight)
            .lineWidth(0.3)
            .strokeColor(LINE)
            .stroke();
        }
        x += colWidth;
      }

      y += rowHeight;
    };

    docData.rows.forEach((row, index) => paintRow(row, index));

    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      drawFooter(doc, i + 1, range.count, docData.exportedBy);
    }

    doc.end();
  });
}
