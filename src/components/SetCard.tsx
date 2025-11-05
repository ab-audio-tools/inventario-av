"use client";
import { useEffect, useMemo, useState } from "react";
import { addToCartMerge, inc, qtyFor, ensureMax, setQty } from "@/lib/cart";

type SetDto = {
  id: number;
  name: string;
  imageUrl?: string | null;
  available: number; // computed on API
  items: { itemId: number; qty: number; name?: string | null; brand?: string | null; model?: string | null }[];
};

export default function SetCard({ set }: { set: SetDto }) {
  const [inCartQty, setInCartQty] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);

  const isGuest = userRole === "GUEST";
  const available = useMemo(() => Math.max(0, set.available - inCartQty), [set.available, inCartQty]);
  const active = inCartQty > 0;

  useEffect(() => {
    fetch("/api/auth/session").then(r => r.json()).then(d => setUserRole(d.user?.role || null)).catch(() => setUserRole(null));
    const refresh = () => {
      ensureMax(set.id, set.available);
      setInCartQty(qtyFor(set.id));
    };
    refresh();
    const onChange = () => refresh();
    window.addEventListener("cart:change", onChange as any);
    return () => window.removeEventListener("cart:change", onChange as any);
  }, [set.id, set.available]);

  function addOne() {
    if (available <= 0) return;
    if (isGuest) return;
    addToCartMerge({ id: set.id, name: set.name, qty: 1, imageUrl: set.imageUrl }, set.available);
  }
  function removeOne() {
    if (isGuest) return;
    if (inCartQty <= 0) return;
    inc(set.id, -1, set.available);
  }
  function removeAll() {
    if (isGuest) return;
    setQty(set.id, 0);
  }

  return (
    <div className={`relative rounded-2xl border p-3 flex gap-3 h-full ${active ? "bg-emerald-50 border-emerald-200" : "bg-white hover:shadow-md transition"}`}>
      <div className="relative w-28 h-28 bg-zinc-100 rounded-xl overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {set.imageUrl ? (
          <img src={set.imageUrl} alt={set.name} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full grid place-content-center text-sm text-zinc-400">no image</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-tight truncate">{set.name}</h3>
          <span className={`text-xs rounded-full border px-2 py-0.5 ${active ? "text-emerald-700 bg-emerald-100 border-emerald-200" : "text-zinc-600 bg-zinc-50"}`}>
            {set.available} pz
          </span>
        </div>
        <div className="text-xs text-zinc-500 mt-1 line-clamp-2">
          Inclusi: {set.items.map((i) => `${i.qty}x ${i.name || i.brand || i.model || i.itemId}`).join(", ")}
        </div>

        {!isGuest && (
          <div className="mt-3 flex items-center gap-3">
            <div className="inline-flex items-center border rounded-xl overflow-hidden">
              <button type="button" onClick={removeOne} disabled={inCartQty <= 0} className="px-3 py-1.5 text-sm disabled:opacity-40 select-none" aria-label="Diminuisci">−</button>
              <div className="px-3 py-1.5 text-sm w-12 text-center tabular-nums">{inCartQty}</div>
              <button type="button" onClick={addOne} disabled={available <= 0} className="px-3 py-1.5 text-sm disabled:opacity-40 select-none" aria-label="Aumenta">+</button>
            </div>

            {inCartQty > 0 && (
              <button type="button" onClick={removeAll} className="text-sm text-red-600 hover:underline" aria-label="Rimuovi">Rimuovi</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


