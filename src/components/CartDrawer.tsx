"use client";
import { useEffect, useMemo, useState } from "react";
import { readCart, writeCart, clearCart, emitCartChange, setQty, CartLine } from "@/lib/cart";
import { displayTitle } from "@/lib/format";

type ItemStock = {
  id: number;
  quantity: number;
  imageUrl?: string | null;
  name?: string | null;
  brand?: string | null;
  model?: string | null;
  typology?: string | null;
  category?: { id: number; name: string } | null;
  description?: string | null;
};

type SetStock = {
  id: number;
  name: string;
  imageUrl?: string | null;
  available: number;
};

export default function CartDrawer() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [itemMap, setItemMap] = useState<Record<number, ItemStock>>({});
  const [setMap, setSetMap] = useState<Record<number, SetStock>>({});

  useEffect(() => {
    setCart(readCart());

    // carica items e sets con metadati completi
    Promise.all([
      fetch("/api/items").then(r => r.json()).catch(() => ({ items: [] })),
      fetch("/api/sets").then(r => r.json()).catch(() => ({ sets: [] })),
    ]).then(([itemsData, setsData]) => {
      const itemMapLocal: Record<number, ItemStock> = {};
      (itemsData.items || []).forEach((it: any) => {
        itemMapLocal[it.id] = {
          id: it.id,
          quantity: it.quantity,
          imageUrl: it.imageUrl,
          name: it.name,
          brand: it.brand,
          model: it.model,
          typology: it.typology,
          category: it.category ?? null,
          description: it.description,
        };
      });
      setItemMap(itemMapLocal);

      const setMapLocal: Record<number, SetStock> = {};
      (setsData.sets || []).forEach((s: any) => {
        setMapLocal[s.id] = {
          id: s.id,
          name: s.name,
          imageUrl: s.imageUrl,
          available: s.available,
        };
      });
      setSetMap(setMapLocal);

      // Cap di eventuali quantità superiori allo stock
      const current = readCart();
      let changed = false;
      const fixed = current.map((l) => {
        const type = l.type || "item";
        let max: number | undefined;
        if (type === "set") {
          max = setMapLocal[l.id]?.available;
        } else {
          max = itemMapLocal[l.id]?.quantity;
        }
        if (typeof max === "number" && l.qty > max) {
          changed = true;
          return { ...l, qty: max };
        }
        return l;
      });
      if (changed) {
        writeCart(fixed);
        setCart(fixed);
        emitCartChange();
      }
    });
  }, []);

  function updateCart(next: CartLine[]) {
    writeCart(next);
    setCart(next);
    emitCartChange();
  }

  function boundedQty(id: number, desired: number, type: "item" | "set" = "item") {
    let max: number | undefined;
    if (type === "set") {
      max = setMap[id]?.available;
    } else {
      max = itemMap[id]?.quantity;
    }
    return Math.max(0, Math.min(desired, max ?? Infinity));
  }

  function setLineQty(id: number, qty: number, type: "item" | "set" = "item") {
    const nextQty = boundedQty(id, qty, type);
    setQty(id, nextQty, type);
    setCart(readCart());
  }

  function incLine(id: number, delta: number, type: "item" | "set" = "item") {
    const current = cart.find((l) => l.id === id && (l.type || "item") === type)?.qty || 0;
    setLineQty(id, current + delta, type);
  }

  const totalCount = useMemo(() => cart.reduce((a, l) => a + l.qty, 0), [cart]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Carrello</h1>
        {cart.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearCart();
              setCart([]);
            }}
            className="text-sm text-zinc-700 hover:text-black underline"
          >
            Svuota carrello
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="rounded-2xl border bg-white p-6 text-zinc-600">Nessun articolo nel carrello.</div>
      ) : (
        <div className="space-y-2">
          {cart.map((c, i) => {
            const type = c.type || "item";
            const isSet = type === "set";
            
            const itemData = !isSet ? itemMap[c.id] : null;
            const setData = isSet ? setMap[c.id] : null;
            
            const stock = isSet ? setData?.available : itemData?.quantity;
            const imageUrl = isSet ? (setData?.imageUrl ?? c.imageUrl ?? null) : (itemData?.imageUrl ?? c.imageUrl ?? null);
            
            // titolo visuale
            const display = isSet ? (setData?.name || c.name) : (itemData ? displayTitle(itemData) : c.name);

            const available = typeof stock === "number" ? Math.max(0, stock - c.qty) : undefined;

            return (
              <div
                key={`${type}-${c.id}-${i}`}
                className="bg-white p-3 rounded-2xl border flex items-center gap-3 min-h-[78px]"
              >
                {/* immagine sx */}
                <div className="relative w-16 h-16 rounded-lg bg-zinc-100 overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {imageUrl ? (
                    <img src={imageUrl} alt={display} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full grid place-content-center text-xs text-zinc-400">
                      no image
                    </div>
                  )}
                </div>

                {/* centro: titolo + meta + descrizione breve */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {isSet && <span className="text-xs text-zinc-400 mr-1">[Set]</span>}
                    {display}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {!isSet && itemData && (
                      <>
                        {itemData.typology ? `${itemData.typology} · ` : ""}
                        {itemData.category?.name ?? "—"}
                      </>
                    )}
                    {isSet && "Set"}
                    {typeof stock === "number" ? (
                      <> · Disponibili: {available ?? 0}</>
                    ) : (
                      <> · Disponibili: —</>
                    )}
                  </div>
                  {!isSet && itemData?.description && (
                    <div className="text-xs text-zinc-600 line-clamp-1">{itemData.description}</div>
                  )}
                </div>

                {/* destra: controlli qty e cestino */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center border rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => incLine(c.id, -1, type)}
                      disabled={c.qty <= 0}
                      className="px-3 py-1.5 text-sm disabled:opacity-40 select-none"
                      aria-label="Diminuisci"
                    >
                      −
                    </button>
                    <div className="px-3 py-1.5 text-sm w-12 text-center tabular-nums">{c.qty}</div>
                    <button
                      type="button"
                      onClick={() => incLine(c.id, +1, type)}
                      disabled={typeof stock === "number" ? c.qty >= stock : false}
                      className="px-3 py-1.5 text-sm disabled:opacity-40 select-none"
                      aria-label="Aumenta"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const next = cart.filter((_, idx) => idx !== i);
                      updateCart(next);
                    }}
                    className="ml-1 px-3 py-1.5 text-sm rounded-lg border hover:bg-zinc-50"
                    aria-label="Rimuovi"
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            );
          })}

          {/* azioni */}
          <div className="flex flex-wrap items-center gap-2 pt-3">
            <div className="ml-auto text-sm text-zinc-600">
              Totale pezzi: <b>{totalCount}</b>
            </div>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/cart/production-manager";
              }}
              className="px-6 py-2 rounded-xl bg-light-blue text-white hover:opacity-90 transition font-medium"
            >
              Continua
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
