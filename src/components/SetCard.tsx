"use client";
import { useEffect, useMemo, useState } from "react";
import { addToCartMerge, inc, qtyFor, ensureMax, setQty } from "@/lib/cart";
import SetEditModal from "./SetEditModal";

type SetDto = {
  id: number;
  name: string;
  imageUrl?: string | null;
  available: number; // computed on API
  items: { itemId: number; qty: number; name?: string | null; brand?: string | null; model?: string | null }[];
};

type Props = {
  set: SetDto;
  userRole?: string | null;
};

export default function SetCard({ set, userRole: userRoleProp }: Props) {
  const [inCartQty, setInCartQty] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(userRoleProp ?? null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  useEffect(() => {
    if (userRoleProp !== undefined) {
      setUserRole(userRoleProp);
      return;
    }
    fetch("/api/auth/session").then(r => r.json()).then(d => setUserRole(d.user?.role || null)).catch(() => setUserRole(null));
  }, [userRoleProp]);

  const isGuest = userRole === "GUEST";
  const canEdit = userRole === "ADMIN" || userRole === "TECH";
  const available = useMemo(() => Math.max(0, set.available - inCartQty), [set.available, inCartQty]);
  const active = inCartQty > 0;

  useEffect(() => {
    const refresh = () => {
      ensureMax(set.id, set.available, "set");
      setInCartQty(qtyFor(set.id, "set"));
    };
    refresh();
    
    const onChange = () => refresh();
    window.addEventListener("cart:change", onChange as any);
    return () => window.removeEventListener("cart:change", onChange as any);
  }, [set.id, set.available]);

  function addOne() {
    if (available <= 0) return;
    if (isGuest) return;
    addToCartMerge({ id: set.id, name: set.name, qty: 1, imageUrl: set.imageUrl, type: "set" }, set.available);
  }
  function removeOne() {
    if (isGuest) return;
    if (inCartQty <= 0) return;
    inc(set.id, -1, set.available, "set");
  }
  function removeAll() {
    if (isGuest) return;
    setQty(set.id, 0, "set");
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
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => setIsInfoOpen(true)} className="text-zinc-400 hover:text-zinc-600 transition p-1" aria-label="Info">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>
            {canEdit && (
              <button type="button" onClick={() => setIsEditOpen(true)} className="text-zinc-400 hover:text-zinc-600 transition p-1" aria-label="Modifica">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            )}
            <span className={`text-xs rounded-full border px-2 py-0.5 ${active ? "text-emerald-700 bg-emerald-100 border-emerald-200" : "text-zinc-600 bg-zinc-50"}`}>
              {set.available} pz
            </span>
          </div>
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
      {canEdit && <SetEditModal set={set} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />}
      {isInfoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setIsInfoOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{set.name}</h2>
              <button type="button" onClick={() => setIsInfoOpen(false)} className="text-zinc-500 hover:text-zinc-900 p-1">✕</button>
            </div>
            {set.imageUrl && (
              <div className="mb-4">
                <img src={set.imageUrl} alt={set.name} className="w-full h-48 object-cover rounded-xl" />
              </div>
            )}
            <div className="space-y-2">
              <div><strong>Disponibilità:</strong> {set.available} pezzi</div>
              <div><strong>Componenti:</strong></div>
              <ul className="list-disc list-inside ml-2 space-y-1">
                {set.items.map((i) => (
                  <li key={i.itemId}>{i.qty}x {i.name || i.brand || i.model || `Item ${i.itemId}`}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


