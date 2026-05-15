export function AdminFooter() {
  return (
    <footer className="shrink-0 border-t border-pika-border bg-pika-card px-4 py-3 text-center text-xs text-pika-muted">
      © {new Date().getFullYear()} Pika · Painel administrativo
    </footer>
  );
}
