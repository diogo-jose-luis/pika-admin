"use client";

import { useCallback, useEffect, useState } from "react";
import { DriverValidationReviewView } from "@/components/drivers/DriverValidationReviewView";
import type { ValidacaoMotoristaDetail } from "@/lib/validacao-motorista";

type ValidacaoMotoristaReviewClientProps = {
  id: string;
};

export function ValidacaoMotoristaReviewClient({
  id,
}: ValidacaoMotoristaReviewClientProps) {
  const [detail, setDetail] = useState<ValidacaoMotoristaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/validacao-motoristas/${id}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as {
        detail?: ValidacaoMotoristaDetail;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Solicitação não encontrada.");
      }
      setDetail(data.detail ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar.");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  if (loading) {
    return (
      <p className="rounded-2xl border border-pika-border bg-pika-card p-8 text-center text-sm text-pika-muted">
        A carregar solicitação…
      </p>
    );
  }

  if (error || !detail) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center text-sm text-red-700">
        {error ?? "Solicitação não encontrada."}
      </p>
    );
  }

  return (
    <DriverValidationReviewView
      detail={detail}
      onStatusUpdated={loadDetail}
    />
  );
}
