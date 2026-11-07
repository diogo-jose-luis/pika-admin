import type { Metadata } from "next";
import { PublicRideLivePage } from "@/components/rides/PublicRideLivePage";

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = {
  title: "Pika · Corrida ao vivo",
  description: "Acompanhe esta corrida Pika em tempo real.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Pika · Corrida ao vivo",
    description: "Acompanhe esta corrida Pika em tempo real.",
    images: ["/logo.png"],
  },
};

export default async function CorridaAoVivoPage({ params }: PageProps) {
  const { id } = await params;
  return <PublicRideLivePage rideId={id} />;
}
