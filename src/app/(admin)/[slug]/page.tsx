import { ComingSoon } from "@/components/ComingSoon";
import { sidebarNav } from "@/lib/nav";
import { notFound } from "next/navigation";

const slugs = new Set(
  sidebarNav.map((item) => item.href.replace(/^\//, "")),
);

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (slug === "dashboard" || !slugs.has(slug)) {
    notFound();
  }
  const item = sidebarNav.find((n) => n.href === `/${slug}`);
  return <ComingSoon title={item?.label ?? "Pika"} />;
}
