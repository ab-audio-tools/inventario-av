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

export default function CartDrawer() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [stockMap, setStockMap] = useState<Record<number, ItemStock>>({});

  useEffect(() => {
    setCart(readCart());

    // carica items con metadati completi
    fetch("/api/items")
      .then((r) => r.json())
      .then((data) => {
        const map: Record<number, ItemStock> = {};
        (data.items || []).forEach((it: any) => {
          map[it.id] = {
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
        setStockMap(map);

        // Cap di eventuali quantità superiori allo stock
        const current = readCart();
        let changed = false;
        const fixed = current.map((l) => {
          const max = map[l.id]?.quantity;
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
      })
      .catch(() => {});
  }, []);

  function updateCart(next: CartLine[]) {
    writeCart(next);
    setCart(next);
    emitCartChange();
  }

  function boundedQty(id: number, desired: number) {
    const stock = stockMap[id]?.quantity ?? Infinity;
    return Math.max(0, Math.min(desired, stock));
  }

  function setLineQty(id: number, qty: number) {
    const nextQty = boundedQty(id, qty);
    setQty(id, nextQty);
    setCart(readCart());
  }

  function incLine(id: number, delta: number) {
    const current = cart.find((l) => l.id === id)?.qty || 0;
    setLineQty(id, current + delta);
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
            const raw = stockMap[c.id];
            const stock = raw?.quantity;
            const imageUrl = raw?.imageUrl ?? c.imageUrl ?? null;

            // titolo visuale anche nel carrello (brand+model o name)
            const display = raw ? displayTitle(raw) : c.name;

            const available =
              typeof stock === "number" ? Math.max(0, stock - c.qty) : undefined;

            return (
              <div
                key={`${c.id}-${i}`}
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
                  <div className="font-medium truncate">{display}</div>
                  <div className="text-xs text-zinc-500">
                    {raw?.typology ? `${raw.typology} · ` : ""}
                    {raw?.category?.name ?? "—"}
                    {typeof stock === "number" ? (
                      <> · Disponibili: {available ?? 0}</>
                    ) : (
                      <> · Disponibili: —</>
                    )}
                  </div>
                  {raw?.description && (
                    <div className="text-xs text-zinc-600 line-clamp-1">{raw.description}</div>
                  )}
                </div>

                {/* destra: controlli qty e cestino */}
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center border rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => incLine(c.id, -1)}
                      disabled={c.qty <= 0}
                      className="px-3 py-1.5 text-sm disabled:opacity-40 select-none"
                      aria-label="Diminuisci"
                    >
                      −
                    </button>
                    <div className="px-3 py-1.5 text-sm w-12 text-center tabular-nums">{c.qty}</div>
                    <button
                      type="button"
                      onClick={() => incLine(c.id, +1)}
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
              className="px-6 py-2 rounded-xl bg-black text-white hover:opacity-90 transition font-medium"
            >
              Continua
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
