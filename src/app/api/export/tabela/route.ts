import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildBrandedTableExcel } from "@/lib/branded-table-excel";
import { buildBrandedTablePdf } from "@/lib/branded-table-pdf";
import { clipText } from "@/lib/branded-export";
import { formatGeneratedAt } from "@/lib/reports-period";
import { parseSessionUserCookie, USER_COOKIE } from "@/lib/session-user";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_ROWS = 1000;
const MAX_COLUMNS = 20;
const MAX_CELL = 400;

function asString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  return clipText(value, max);
}

export async function POST(request: Request) {
  const jar = await cookies();
  const session = parseSessionUserCookie(jar.get(USER_COOKIE)?.value);
  if (!session) {
    return NextResponse.json({ error: "Sessão em falta." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const record =
    body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const format = record?.format === "pdf" || record?.format === "excel" ? record.format : null;
  const title = asString(record?.title, 80);
  const fileBaseRaw = typeof record?.fileBase === "string" ? record.fileBase.trim() : "";
  const fileBase = /^[a-z0-9-]{3,40}$/.test(fileBaseRaw) ? fileBaseRaw : null;
  const exportedBy =
    asString(record?.exportedBy, 80) || session.displayName || "Administrador";

  const columns = Array.isArray(record?.columns)
    ? record.columns
        .map((column) => (typeof column === "string" ? clipText(column, 60) : ""))
        .filter(Boolean)
    : [];

  const rows = Array.isArray(record?.rows)
    ? record.rows.map((row) =>
        Array.isArray(row)
          ? row.map((cell) => (typeof cell === "string" ? clipText(cell, MAX_CELL) : ""))
          : [],
      )
    : [];

  if (!format || !title || !fileBase) {
    return NextResponse.json(
      { error: "Indique o formato, o título e o nome do ficheiro." },
      { status: 400 },
    );
  }

  if (columns.length === 0 || columns.length > MAX_COLUMNS) {
    return NextResponse.json(
      { error: "Seleccione entre 1 e 20 campos." },
      { status: 400 },
    );
  }

  if (rows.length === 0) {
    return NextResponse.json(
      { error: "Seleccione pelo menos um registo." },
      { status: 400 },
    );
  }

  if (rows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `O export está limitado a ${MAX_ROWS} registos de cada vez.` },
      { status: 400 },
    );
  }

  if (rows.some((row) => row.length !== columns.length)) {
    return NextResponse.json(
      { error: "Os campos e os registos não coincidem." },
      { status: 400 },
    );
  }

  const document = {
    title,
    exportedBy,
    columns,
    rows,
    generatedAt: formatGeneratedAt(),
  };

  const stamp = document.generatedAt.slice(0, 10).split("/").reverse().join("-");
  const filename = `${fileBase}-${stamp || "pika"}.${format === "pdf" ? "pdf" : "xlsx"}`;

  try {
    if (format === "pdf") {
      const buffer = await buildBrandedTablePdf(document);
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const buffer = await buildBrandedTableExcel(document);
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
    console.error("[export/tabela]", error);
    return NextResponse.json(
      { error: "Não foi possível gerar o ficheiro." },
      { status: 500 },
    );
  }
}
