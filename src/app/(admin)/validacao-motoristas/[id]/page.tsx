import { ValidacaoMotoristaReviewClient } from "@/components/drivers/ValidacaoMotoristaReviewClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ValidacaoMotoristaRevisaoPage({ params }: PageProps) {
  const { id } = await params;
  return <ValidacaoMotoristaReviewClient id={id} />;
}
