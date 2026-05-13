export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="rounded-2xl border border-pika-border bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-pika-ink">{title}</h2>
      <p className="mt-2 text-sm text-pika-muted">
        Esta secção está em preparação. Em breve poderá gerir tudo a partir deste
        ecrã.
      </p>
    </div>
  );
}
