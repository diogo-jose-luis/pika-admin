/** Extrai o ID do documento a partir de uma referência Firestore ou path. */
export function refToDocId(ref: unknown): string | null {
  if (ref == null) return null;

  if (typeof ref === "string") {
    const parts = ref.split("/").filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1]! : null;
  }

  if (typeof ref === "object") {
    if ("id" in ref && typeof (ref as { id: unknown }).id === "string") {
      return (ref as { id: string }).id;
    }
    if ("path" in ref && typeof (ref as { path: unknown }).path === "string") {
      const parts = (ref as { path: string }).path.split("/").filter(Boolean);
      return parts.length > 0 ? parts[parts.length - 1]! : null;
    }
    if (
      "_path" in ref &&
      typeof (ref as { _path: { segments?: string[] } })._path === "object"
    ) {
      const segments = (ref as { _path: { segments?: string[] } })._path
        .segments;
      if (segments?.length) return segments[segments.length - 1]!;
    }
  }

  return null;
}
