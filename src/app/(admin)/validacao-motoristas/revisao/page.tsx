"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ValidacaoMotoristaReviewClient } from "@/components/drivers/ValidacaoMotoristaReviewClient";

function ValidacaoMotoristaRevisaoInner() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id")?.trim() ?? "";

  if (!id) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        Solicitação não encontrada.
      </p>
    );
  }

  return <ValidacaoMotoristaReviewClient id={id} />;
}

export default function ValidacaoMotoristaRevisaoPage() {
  return (
    <Suspense
      fallback={
        <p className="rounded-2xl border border-pika-border bg-pika-card p-8 text-center text-sm text-pika-muted">
          A carregar solicitação…
        </p>
      }
    >
      <ValidacaoMotoristaRevisaoInner />
    </Suspense>
  );
}
