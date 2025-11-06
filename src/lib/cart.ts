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
  const cart = getCart();
  const entry = cart.find((x) => x.id === id && x.type === type);
  return entry ? entry.qty : 0;
}

export function setQty(id: number, qty: number, type: "item" | "set" = "item"): void {
  let cart = getCart();
  const idx = cart.findIndex((x) => x.id === id && x.type === type);
  if (idx >= 0) {
    if (qty <= 0) {
      cart.splice(idx, 1);
    } else {
      cart[idx] = { ...cart[idx], qty };
    }
  } else if (qty > 0) {
    cart.push({ id, qty, type, name: `${type === "set" ? "Set" : "Item"} ${id}` });
  }
  saveCart(cart);
  window.dispatchEvent(new CustomEvent("cart:change"));
}

export function inc(id: number, delta: number, maxQty: number, type: "item" | "set" = "item"): void {
  const current = qtyFor(id, type);
  const newQty = Math.max(0, Math.min(current + delta, maxQty));
  setQty(id, newQty, type);
}

export function ensureMax(id: number, maxQty: number, type: "item" | "set" = "item"): void {
  const current = qtyFor(id, type);
  if (current > maxQty) {
    setQty(id, maxQty, type);
  }
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

export function normalizeCart() {
  writeCart(mergeById(readCart()));
}

export function addToCartMerge(line: CartLine, max?: number) {
  const merged = mergeById([...readCart(), line]);
  if (typeof max === "number") {
    const idx = merged.findIndex((l) => l.id === line.id && (l.type || "item") === (line.type || "item"));
    if (idx >= 0) merged[idx].qty = Math.min(Math.max(0, merged[idx].qty), Math.max(0, max));
  }
  writeCart(merged);
  emitCartChange();
  emitCartAdded(line);
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

function getCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(KEY));
}

function saveCart(cart: CartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(cart));
}
