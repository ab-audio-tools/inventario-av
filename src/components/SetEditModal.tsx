"use client";
import { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import ImageUploader from "./ImageUploader";

type SetDto = {
  id: number;
  name: string;
  imageUrl?: string | null;
  available?: number;
  categoryId?: number | null; // <- nuovo campo
  items: { itemId: number; qty: number; name?: string | null; brand?: string | null; model?: string | null }[];
};

type Props = {
  set: SetDto;
  isOpen: boolean;
  onClose: () => void;
};

export default function SetEditModal({ set, isOpen, onClose }: Props) {
  const [form, setForm] = useState({ name: set.name, imageUrl: set.imageUrl ?? "", restricted: false, categoryId: set.categoryId ?? null });
  const [components, setComponents] = useState<{ itemId: number; qty: number; name: string }[]>([]);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); // <- categorie
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({ name: set.name, imageUrl: set.imageUrl ?? "", restricted: false, categoryId: set.categoryId ?? null });
    setComponents(set.items.map((i) => ({ itemId: i.itemId, qty: i.qty, name: i.name || i.brand || i.model || `Item ${i.itemId}` })));
    fetch("/api/items").then(r => r.json()).then(d => setAllItems(d.items || [])).catch(() => setAllItems([]));
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || [])).catch(() => setCategories([]));
    fetch(`/api/sets/${set.id}`).then(r => r.json()).then(d => {
      if (d.set?.restricted !== undefined) setForm(f => ({ ...f, restricted: d.set.restricted }));
      if (d.set?.categoryId !== undefined) setForm(f => ({ ...f, categoryId: d.set.categoryId }));
    }).catch(() => {});
  }, [isOpen, set]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return allItems.filter((it) => {
      const fields = [it.name, it.brand, it.model, it.typology, it.sku, it.description];
      return fields.some((f: string) => (f || "").toLowerCase().includes(ql));
    });
  }, [allItems, q]);

  function addComponent(it: any) {
    if (components.some(c => c.itemId === it.id)) return;
    setComponents([...components, { itemId: it.id, qty: 1, name: it.name || `${it.brand || ""} ${it.model || ""}`.trim() || `Item ${it.id}` }]);
  }

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!form.name.trim() || components.length === 0) {
      alert("Inserisci un nome e almeno un articolo nel set");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/sets/${set.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          imageUrl: form.imageUrl || null,
          restricted: form.restricted,
          categoryId: form.categoryId ?? null, // <- invia categoria
          items: components.map(c => ({ itemId: c.itemId, qty: c.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Errore aggiornamento set");
        setLoading(false);
        return;
      }
      onClose();
      window.location.reload();
    } catch (err) {
      alert("Errore durante l'aggiornamento");
      setLoading(false);
    }
  }

  async function handleDeleteSet() {
    if (!confirm("Sei sicuro di voler eliminare questo set? Questa operazione è irreversibile.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/sets/${set.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || "Errore durante l'eliminazione");
        setLoading(false);
        return;
      }
      onClose();
      window.location.reload();
    } catch (err) {
      alert("Errore di connessione durante l'eliminazione");
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-light-blue/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold">Modifica Set</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-900 p-1">✕</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-600">Nome</label>
              <input className="w-full border rounded-xl px-3 py-2" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-zinc-600">Categoria</label>
              <select
                className="w-full border rounded-xl px-3 py-2"
                value={form.categoryId ?? ""}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : null;
                  setForm({ ...form, categoryId: v });
                }}
              >
                <option value="">Nessuna</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input id="restricted" type="checkbox" checked={form.restricted} onChange={(e) => setForm({ ...form, restricted: e.target.checked })} />
              <label htmlFor="restricted" className="text-sm text-zinc-700">Visibile solo a Admin/Tech</label>
            </div>
          </div>

          <div>
            <ImageUploader label="Immagine set" value={form.imageUrl} onUploaded={(url) => setForm({ ...form, imageUrl: url })} />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-2xl p-3">
              <div className="relative">
                <input 
                  className="w-full border rounded-xl px-3 py-2" 
                  placeholder="Cerca articoli..." 
                  value={q} 
                  onChange={(e) => setQ(e.target.value)} 
                />
                {q.trim() && filtered.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-xl shadow-lg max-h-72 overflow-auto">
                    {filtered.map((it) => (
                      <button 
                        key={it.id} 
                        type="button" 
                        onClick={() => {
                          addComponent(it);
                          setQ("");
                        }} 
                        className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 border-b last:border-b-0"
                      >
                        <div className="w-12 h-12 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
                          {it.imageUrl ? (
                            <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">
                            {(it.name || `${it.brand || ""} ${it.model || ""}`).trim() || `Item ${it.id}`}
                          </div>
                          {it.typology && (
                            <div className="text-xs text-zinc-500">{it.typology}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border rounded-2xl p-3">
              <div className="font-medium mb-2">Componenti del set</div>
              {components.length === 0 ? (
                <div className="text-sm text-zinc-500">Nessun articolo selezionato</div>
              ) : (
                <div className="space-y-2">
                  {components.map((c, idx) => (
                    <div key={c.itemId} className="flex items-center gap-2">
                      <div className="flex-1 min-w-0 truncate">{c.name}</div>
                      <input type="number" min={1} className="w-20 border rounded-lg px-2 py-1 text-sm" value={c.qty}
                        onChange={(e) => {
                          const v = Math.max(1, Number(e.target.value) || 1);
                          const next = [...components];
                          next[idx] = { ...next[idx], qty: v };
                          setComponents(next);
                        }} />
                      <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => setComponents(components.filter(x => x.itemId !== c.itemId))}>Rimuovi</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-zinc-50">Annulla</button>
            <button type="button" onClick={handleDeleteSet} disabled={loading} className="px-4 py-2 rounded-xl bg-red-600 text-white hover:opacity-90 disabled:opacity-40">
              {loading ? "Eliminazione..." : "Elimina"}
            </button>
            <button type="submit" disabled={!form.name || components.length === 0 || loading} className="px-4 py-2 rounded-xl bg-light-blue text-white disabled:opacity-40">
              {loading ? "Salvataggio..." : "Salva Modifiche"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

