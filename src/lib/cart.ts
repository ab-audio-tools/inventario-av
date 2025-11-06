export type CartLine = { id: number; name: string; qty: number; imageUrl?: string | null; type?: "item" | "set" };

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
          type: (l.type === "set" ? "set" : "item") as "item" | "set",
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

export function qtyFor(id: number, type: "item" | "set" = "item"): number {
  return readCart().filter((l) => l.id === id && (l.type || "item") === type).reduce((a, l) => a + (Number(l.qty) || 0), 0);
}

export function cartCount(): number {
  return readCart().reduce((acc, l) => acc + (Number(l.qty) || 0), 0);
}

function mergeById(lines: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const l of lines) {
    const key = `${l.type || "item"}-${l.id}`;
    const prev = map.get(key);
    map.set(key, prev ? { ...prev, qty: (prev.qty || 0) + (l.qty || 0), name: l.name || prev.name, imageUrl: l.imageUrl ?? prev.imageUrl } : { ...l });
  }
  return Array.from(map.values());
}

/** Cap globale (una tantum o ricorrente) al massimo consentito per quell'id */
export function ensureMax(id: number, max: number, type: "item" | "set" = "item") {
  const lines = readCart();
  let changed = false;
  const next = lines.map((l) => {
    if (l.id !== id || (l.type || "item") !== type) return l;
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

export function setQty(id: number, qty: number, type: "item" | "set" = "item") {
  const lines = readCart();
  const nextQty = Math.max(0, Math.floor(Number(qty) || 0));

  // rimuovi se 0, altrimenti imposta esattamente la qty
  const idx = lines.findIndex(l => l.id === id && (l.type || "item") === type);
  let next: CartLine[];
  if (nextQty <= 0) {
    next = idx >= 0 ? lines.filter(l => !(l.id === id && (l.type || "item") === type)) : lines;
  } else {
    if (idx >= 0) {
      next = [...lines];
      next[idx] = { ...next[idx], qty: nextQty };
    } else {
      next = [...lines, { id, name: "", qty: nextQty, type }];
    }
  }

  writeCart(next);
  emitCartChange();
}

export function inc(id: number, delta: number, max?: number, type: "item" | "set" = "item") {
  const current = qtyFor(id, type);
  let next = current + (Number(delta) || 0);
  if (typeof max === "number") next = Math.min(Math.max(0, next), Math.max(0, max));
  if (next === current) return; // niente da fare
  setQty(id, next, type);
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
