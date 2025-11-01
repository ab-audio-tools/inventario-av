export function displayTitle(item: {
  brand?: string | null;
  model?: string | null;
  name?: string | null;
}) {
  const b = (item.brand || "").trim();
  const m = (item.model || "").trim();
  const n = (item.name || "").trim();
  if (b && m) return `${b} ${m}`;
  if (n) return n;
  // fallback gentile se mancano tutti
  return [b, m].filter(Boolean).join(" ") || "Senza nome";
}
