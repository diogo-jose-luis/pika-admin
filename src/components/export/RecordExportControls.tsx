"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileExcel, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { OffCanvas } from "@/components/ui/OffCanvas";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/components/providers/LocaleProvider";
import { cn } from "@/lib/cn";

export const TABLE_PAGE_SIZES = [20, 50, 100] as const;
export const DEFAULT_TABLE_PAGE_SIZE = 100;

export type ExportField = {
  key: string;
  label: string;
  defaultSelected?: boolean;
};

type ExportFormat = "pdf" | "excel";

type RecordExportControlsProps = {
  title: string;
  fileBase: string;
  fields: ExportField[];
  selectedCount: number;
  buildRows: (keys: string[]) => string[][];
};

function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const plain = /filename="([^"]+)"/i.exec(header);
  return plain?.[1] ?? fallback;
}

export function PageSizeSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (size: number) => void;
}) {
  const { t } = useLocale();
  return (
    <label className="inline-flex items-center gap-2 text-sm text-pika-muted">
      <span className="whitespace-nowrap">{t("export.perPage")}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        aria-label={t("export.perPage")}
        className="rounded-lg border border-pika-border bg-pika-card px-2 py-1.5 text-sm font-semibold text-pika-ink outline-none ring-pika-primary/25 focus:border-pika-primary focus:ring-2"
      >
        {TABLE_PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  );
}

export function RecordExportControls({
  title,
  fileBase,
  fields,
  selectedCount,
  buildRows,
}: RecordExportControlsProps) {
  const { t } = useLocale();
  const { user } = useAuth();
  const [format, setFormat] = useState<ExportFormat | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = format != null;
  const blocked = selectedCount === 0 || exporting;

  const openPicker = (next: ExportFormat) => {
    if (selectedCount === 0) return;
    setFormat(next);
    setChosen(
      new Set(
        fields
          .filter((field) => field.defaultSelected !== false)
          .map((field) => field.key),
      ),
    );
    setError(null);
  };

  const toggleField = (key: string) => {
    setChosen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const confirm = async () => {
    if (!format) return;
    const selectedFields = fields.filter((field) => chosen.has(field.key));
    if (selectedFields.length === 0) {
      setError(t("export.minOne"));
      return;
    }

    const rows = buildRows(selectedFields.map((field) => field.key));
    if (rows.length === 0) {
      setError(t("export.needSelection"));
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const response = await fetch("/api/export/tabela", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          title,
          fileBase,
          exportedBy: user?.name?.trim() || user?.email || "Administrador",
          columns: selectedFields.map((field) => field.label),
          rows,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!response.ok || contentType.includes("application/json")) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? t("export.error"));
      }

      const blob = await response.blob();
      const fallback = `${fileBase}.${format === "pdf" ? "pdf" : "xlsx"}`;
      const filename = filenameFromDisposition(
        response.headers.get("content-disposition"),
        fallback,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setFormat(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("export.error"));
    } finally {
      setExporting(false);
    }
  };

  const iconButton = (next: ExportFormat, label: string) => {
    const isPdf = next === "pdf";
    return (
      <button
        type="button"
        onClick={() => openPicker(next)}
        disabled={blocked}
        aria-label={label}
        title={blocked && selectedCount === 0 ? t("export.needSelection") : `${label} (${selectedCount})`}
        className={cn(
          "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-pika-border bg-pika-card transition hover:border-pika-primary disabled:cursor-not-allowed disabled:opacity-40",
          isPdf ? "text-red-600" : "text-emerald-700",
        )}
      >
        <FontAwesomeIcon icon={isPdf ? faFilePdf : faFileExcel} className="h-4 w-4" />
      </button>
    );
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {iconButton("pdf", t("export.pdf"))}
        {iconButton("excel", t("export.excel"))}
      </div>

      <OffCanvas
        open={open}
        busy={exporting}
        onClose={() => {
          if (!exporting) setFormat(null);
        }}
        title={t("export.fieldsTitle")}
        subtitle={
          format
            ? t("export.fieldsSubtitle", {
                count: selectedCount,
                format: format === "pdf" ? "PDF" : "Excel",
              })
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setFormat(null)}
              disabled={exporting}
              className="inline-flex items-center justify-center rounded-xl border border-pika-border bg-pika-card px-4 py-2 text-sm font-semibold text-pika-muted transition hover:text-pika-ink disabled:opacity-50"
            >
              {t("common.cancel")}
            </button>
            <button
              type="button"
              onClick={() => void confirm()}
              disabled={exporting || chosen.size === 0}
              className="inline-flex items-center justify-center rounded-xl bg-pika-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting ? t("export.exporting") : t("export.confirm")}
            </button>
          </>
        }
      >
        <div className="px-5 py-4">
          <p className="text-sm text-pika-muted">{t("export.hint")}</p>
          <p className="mt-1 text-sm text-pika-muted">{t("export.onlySelected")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setChosen(new Set(fields.map((field) => field.key)))}
              className="rounded-lg border border-pika-border px-3 py-1.5 text-xs font-semibold text-pika-ink transition hover:border-pika-primary hover:text-pika-primary"
            >
              {t("export.selectAll")}
            </button>
            <button
              type="button"
              onClick={() => setChosen(new Set())}
              className="rounded-lg border border-pika-border px-3 py-1.5 text-xs font-semibold text-pika-muted transition hover:text-pika-ink"
            >
              {t("export.clearFields")}
            </button>
          </div>
          <ul className="mt-4 space-y-2">
            {fields.map((field) => {
              const checked = chosen.has(field.key);
              return (
                <li key={field.key}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition",
                      checked
                        ? "border-pika-primary/40 bg-pika-primary/5 text-pika-ink"
                        : "border-pika-border text-pika-muted hover:text-pika-ink",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleField(field.key)}
                      className="h-4 w-4 rounded border-pika-border text-pika-primary focus:ring-pika-primary"
                    />
                    {field.label}
                  </label>
                </li>
              );
            })}
          </ul>
          {error ? (
            <p className="mt-4 text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </OffCanvas>
    </>
  );
}
