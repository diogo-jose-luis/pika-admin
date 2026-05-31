import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loadReportPeriodData } from "@/lib/reports-data";
import { buildReportExcel } from "@/lib/reports-excel";
import { buildReportPdf } from "@/lib/reports-pdf";
import {
  reportFilename,
  type ReportFormat,
  type ReportTypeId,
} from "@/lib/reports-meta";
import {
  normalizeReportMonth,
  normalizeReportYear,
} from "@/lib/reports-period";
import { parseSessionUserCookie, USER_COOKIE } from "@/lib/session-user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VALID_TYPES: ReportTypeId[] = [
  "financeiro",
  "corridas",
  "motoristas",
  "tendencias",
];

function parseType(value: string | null): ReportTypeId | null {
  if (!value) return null;
  return VALID_TYPES.includes(value as ReportTypeId)
    ? (value as ReportTypeId)
    : null;
}

function parseFormat(value: string | null): ReportFormat | null {
  if (value === "pdf" || value === "excel") return value;
  return null;
}

async function exportedByName(): Promise<string> {
  const jar = await cookies();
  const parsed = parseSessionUserCookie(jar.get(USER_COOKIE)?.value);
  if (parsed?.displayName?.trim()) return parsed.displayName.trim();
  return "Administrador";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = parseType(searchParams.get("type"));
    const format = parseFormat(searchParams.get("format"));
    const month = normalizeReportMonth(searchParams.get("month"));
    const year = normalizeReportYear(searchParams.get("year"));
    const exportedByParam = searchParams.get("exportedBy")?.trim();

    if (!type || !format) {
      return NextResponse.json(
        { error: "Parâmetros type e format são obrigatórios." },
        { status: 400 },
      );
    }

    const exportedBy = exportedByParam || (await exportedByName());
    const data = await loadReportPeriodData(year, month);
    const filename = reportFilename(type, format, year, month);

    if (format === "pdf") {
      const buffer = await buildReportPdf(type, data, exportedBy);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const buffer = await buildReportExcel(type, data, exportedBy);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Erro desconhecido";
    console.error("[relatorios/export]", error);
    return NextResponse.json(
      {
        error: "Não foi possível gerar o relatório.",
        detail:
          process.env.NODE_ENV === "development" ? detail : undefined,
      },
      { status: 500 },
    );
  }
}
