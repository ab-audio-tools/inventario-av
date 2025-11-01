export type CartLine = { id: number; name: string; qty: number; imageUrl?: string | null };

const KEY = "cart";

function safeParse(raw: string | null): CartLine[] {
  try {
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr)
      ? arr.map((l) => ({
          id: Number(l.id),
          name: String(l.name ?? ""),
          qty: Math.max(0, Number(l.qty) || 0),
          imageUrl: l.imageUrl ?? null,
        }))
      : [];
  } catch {
    return [];
  }
}

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(KEY));
}

export function writeCart(lines: CartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(lines));
}

export function qtyFor(id: number): number {
  return readCart().filter((l) => l.id === id).reduce((a, l) => a + (Number(l.qty) || 0), 0);
}

export function cartCount(): number {
  return readCart().reduce((acc, l) => acc + (Number(l.qty) || 0), 0);
}

function mergeById(lines: CartLine[]): CartLine[] {
  const map = new Map<number, CartLine>();
  for (const l of lines) {
    const prev = map.get(l.id);
    map.set(l.id, prev ? { ...prev, qty: (prev.qty || 0) + (l.qty || 0), name: l.name || prev.name, imageUrl: l.imageUrl ?? prev.imageUrl } : { ...l });
  }
  return Array.from(map.values());
}

/** Cap globale (una tantum o ricorrente) al massimo consentito per quell'id */
export function ensureMax(id: number, max: number) {
  const lines = readCart();
  let changed = false;
  const next = lines.map((l) => {
    if (l.id !== id) return l;
    const q = Math.min(Math.max(0, l.qty || 0), Math.max(0, max));
    if (q !== l.qty) changed = true;
    return { ...l, qty: q };
  });
  if (changed) {
    writeCart(next);
    emitCartChange();
  }
}

export function normalizeCart() {
  writeCart(mergeById(readCart()));
}

export function addToCartMerge(line: CartLine, max?: number) {
  const merged = mergeById([...readCart(), line]);
  if (typeof max === "number") {
    const idx = merged.findIndex((l) => l.id === line.id);
    if (idx >= 0) merged[idx].qty = Math.min(Math.max(0, merged[idx].qty), Math.max(0, max));
  }
  writeCart(merged);
  emitCartChange();
  emitCartAdded(line);
}

export function setQty(id: number, qty: number) {
  const lines = readCart();
  const nextQty = Math.max(0, Math.floor(Number(qty) || 0));

  // rimuovi se 0, altrimenti imposta esattamente la qty
  const idx = lines.findIndex(l => l.id === id);
  let next: CartLine[];
  if (nextQty <= 0) {
    next = idx >= 0 ? lines.filter(l => l.id !== id) : lines;
  } else {
    if (idx >= 0) {
      next = [...lines];
      next[idx] = { ...next[idx], qty: nextQty };
    } else {
      next = [...lines, { id, name: "", qty: nextQty }];
    }
  }

  writeCart(next);
  emitCartChange();
}

export function inc(id: number, delta: number, max?: number) {
  const current = qtyFor(id);
  let next = current + (Number(delta) || 0);
  if (typeof max === "number") next = Math.min(Math.max(0, next), Math.max(0, max));
  if (next === current) return; // niente da fare
  setQty(id, next);
}

export function removeCartIndex(idx: number) {
  const lines = readCart();
  lines.splice(idx, 1);
  writeCart(lines);
  emitCartChange();
}

export function clearCart() {
  writeCart([]);
  emitCartChange();
}

export function distinctCount(): number {
  const ids = new Set(readCart().map(l => l.id));
  return ids.size;
}

export function emitCartChange() {
  const total = cartCount();      // somma delle qty (se mai dovesse servirti)
  const distinct = distinctCount(); // numero di articoli diversi
  window.dispatchEvent(new CustomEvent("cart:change", { detail: { count: total, distinct } }));
}

export function emitCartAdded(line: CartLine) {
  window.dispatchEvent(new CustomEvent("cart:added", { detail: line }));
}
