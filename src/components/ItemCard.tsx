"use client";
import { useEffect, useMemo, useState } from "react";
import { addToCartMerge, inc, qtyFor, ensureMax, setQty, readCart } from "@/lib/cart";
import { displayTitle } from "@/lib/format";
import ProductDetailModal from "@/components/ProductDetailModal";
import ItemEditModal from "@/components/ItemEditModal";

type Item = {
  id: number;
  brand?: string | null;
  model?: string | null;
  name?: string | null;
  typology?: string | null;
  sku?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  quantity: number;
  category?: { id: number; name: string } | null;
};

export default function ItemCard({ item, viewMode = "grid", allSets }: { item: Item; viewMode?: "grid" | "list"; allSets?: any[] }) {
  const [inCartQty, setInCartQty] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [reservedBySet, setReservedBySet] = useState(0);

  const isGuest = userRole === "GUEST";
  const canEdit = userRole === "ADMIN" || userRole === "TECH";

  useEffect(() => {
    // load session role for guest checks
    console.log('ItemCard loading session for item:', item.id);
    fetch("/api/auth/session")
      .then((r) => {
        console.log('Session response status:', r.status);
        return r.json();
      })
      .then((d) => {
        console.log('Session data for item', item.id, ':', d);
        setUserRole(d.user?.role || null);
      })
      .catch((error) => {
        console.error('Session fetch error for item', item.id, ':', error);
        setUserRole(null);
      });
    const refresh = () => {
      ensureMax(item.id, item.quantity);
      setInCartQty(qtyFor(item.id));
      
      // Calcola quanti pezzi sono riservati dai set
      if (allSets && allSets.length > 0) {
        const cart = readCart();
        let reserved = 0;
        cart.forEach(cartLine => {
          if (cartLine.type === "set") {
            const setData = allSets.find(s => s.id === cartLine.id);
            if (setData && setData.items) {
              const itemInSet = setData.items.find((si: any) => si.itemId === item.id);
              if (itemInSet) {
                reserved += cartLine.qty * itemInSet.qty;
              }
            }
          }
        });
        setReservedBySet(reserved);
      }
    };
    refresh();
    const onChange = () => refresh();
    window.addEventListener("cart:change", onChange as any);
    return () => window.removeEventListener("cart:change", onChange as any);
  }, [item.id, item.quantity, allSets]);

  const title = displayTitle(item);
  const available = useMemo(
    () => Math.max(0, item.quantity - inCartQty - reservedBySet),
    [item.quantity, inCartQty, reservedBySet]
  );
  const active = inCartQty > 0 || reservedBySet > 0;

  function addOne() {
    if (available <= 0) return;
    if (isGuest) return; // guests cannot add
    // salva nel carrello il titolo visuale (brand+model o name)
    addToCartMerge(
      { id: item.id, name: title, qty: 1, imageUrl: item.imageUrl },
      item.quantity
    );
  }
  function removeOne() {
    if (isGuest) return;
    if (inCartQty <= 0) return;
    inc(item.id, -1, item.quantity);
  }
  function removeAll() {
    if (isGuest) return;
    setQty(item.id, 0);
  }

  if (viewMode === "list") {
    return (
      <div
        className={`relative rounded-xl border p-3 flex items-center gap-4 ${
          active ? "bg-emerald-50 border-emerald-200" : "bg-white hover:shadow-md transition"
        }`}
      >
        {/* Image on the left */}
        <div className="relative w-20 h-20 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={title} className="object-cover w-full h-full" />
          ) : (
            <div className="w-full h-full grid place-content-center text-xs text-zinc-400">
              no image
            </div>
          )}
        </div>

        {/* Middle: Title, Typology, Category */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium leading-tight">{title}</h3>
          <div className="text-xs text-zinc-500 mt-0.5">
            {item.typology ? `${item.typology} · ` : ""}
            {item.category?.name ?? "—"}
          </div>
        </div>

        {/* Right: Quantity, Selector, Remove */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Info icon */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="text-zinc-400 hover:text-zinc-600 transition p-1"
            aria-label="Dettagli prodotto"
            title="Dettagli prodotto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </button>

          {/* Edit icon for Admin/Tech */}
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="text-zinc-400 hover:text-zinc-600 transition p-1 ml-1"
              aria-label="Modifica articolo"
              title="Modifica articolo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          )}

          {/* Stock quantity - same style as grid */}
          <span
            className={`text-xs rounded-full border px-2 py-0.5 ${
              active ? "text-emerald-700 bg-emerald-100 border-emerald-200" : "text-zinc-600 bg-zinc-50"
            }`}
          >
            {item.quantity} pz
          </span>

          {/* Hide cart info and controls for guests */}
          {!isGuest && (
            <>
              <span className="text-xs text-zinc-500">Nel carrello: {inCartQty}</span>
              <span className="text-xs text-zinc-500">· Disponibili: {available}</span>

              <div className="inline-flex items-center border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={removeOne}
                  disabled={inCartQty <= 0}
                  className="px-3 py-1.5 text-sm disabled:opacity-40 select-none"
                  aria-label="Diminuisci"
                >
                  −
                </button>
                <div className="px-3 py-1.5 text-sm w-12 text-center tabular-nums">{inCartQty}</div>
                <button
                  type="button"
                  onClick={addOne}
                  disabled={available <= 0}
                  className="px-3 py-1.5 text-sm disabled:opacity-40 select-none"
                  aria-label="Aumenta"
                  title={available <= 0 ? "Raggiunto lo stock massimo" : "Aumenta di 1"}
                >
                  +
                </button>
              </div>

              <div className="min-w-[70px] text-right">
                {inCartQty > 0 && (
                  <button
                    type="button"
                    onClick={removeAll}
                    className="text-sm text-red-600 hover:underline"
                    aria-label="Rimuovi dal carrello"
                    title="Rimuovi dal carrello"
                  >
                    Rimuovi
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Product Detail Modal */}
        <ProductDetailModal
          item={item}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
        {/* Edit Modal */}
        {canEdit && (
          <ItemEditModal
            item={item}
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
          />
        )}
      </div>
    );
  }

  // Grid view (original layout)
  return (
    <div
      className={`relative rounded-2xl border p-3 flex gap-3 h-full ${
        active ? "bg-emerald-50 border-emerald-200" : "bg-white hover:shadow-md transition"
      }`}
    >
      {/* immagine: dimensioni fisse */}
      <div className="relative w-28 h-28 bg-zinc-100 rounded-xl overflow-hidden shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={title} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full grid place-content-center text-sm text-zinc-400">
            no image
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium leading-tight truncate">{title}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {/* Info icon */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="text-zinc-400 hover:text-zinc-600 transition p-1"
              aria-label="Dettagli prodotto"
              title="Dettagli prodotto"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </button>

            {/* Edit icon for Admin/Tech */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="text-zinc-400 hover:text-zinc-600 transition p-1"
                aria-label="Modifica articolo"
                title="Modifica articolo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* meta */}
        <div className="text-xs text-zinc-500 mt-0.5">
          {item.typology ? `${item.typology} · ` : ""}
          {item.category?.name ?? "—"}
        </div>

        {/* stato carrello + disponibili (nascosto per guest) */}
        {!isGuest && (
          <div className="mt-2 text-xs h-5 flex items-center">
            <span className={active ? "font-medium text-emerald-700" : "text-zinc-500"}>
              Nel carrello: {inCartQty}
            </span>
            <span className="text-zinc-500 ml-1">· Disponibili: {available}</span>
          </div>
        )}

        {/* controlli quantità (nascosti per guest) */}
        {!isGuest && (
          <div className="mt-3 flex items-center gap-3">
            <div className="inline-flex items-center border rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={removeOne}
                disabled={inCartQty <= 0}
                className="px-3 py-1.5 text-sm disabled:opacity-40 select-none"
                aria-label="Diminuisci"
              >
                −
              </button>
              <div className="px-3 py-1.5 text-sm w-12 text-center tabular-nums">{inCartQty}</div>
              <button
                type="button"
                onClick={addOne}
                disabled={available <= 0}
                className="px-3 py-1.5 text-sm disabled:opacity-40 select-none"
                aria-label="Aumenta"
                title={available <= 0 ? "Raggiunto lo stock massimo" : "Aumenta di 1"}
              >
                +
              </button>
            </div>

            {inCartQty > 0 && (
              <button
                type="button"
                onClick={removeAll}
                className="text-sm text-red-600 hover:underline"
                aria-label="Rimuovi dal carrello"
                title="Rimuovi dal carrello"
              >
                Rimuovi
              </button>
            )}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        item={item}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      {/* Edit Modal */}
      {canEdit && (
        <ItemEditModal
          item={item}
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
}