"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import ImageUploader from "./ImageUploader";

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

type Props = {
  item: Item;
  isOpen: boolean;
  onClose: () => void;
};

export default function ItemEditModal({ item, isOpen, onClose }: Props) {
  const [form, setForm] = useState({
    brand: item.brand ?? "",
    model: item.model ?? "",
    name: item.name ?? "",
    typology: item.typology ?? "",
    categoryId: item.category?.id ? String(item.category.id) : "",
    sku: item.sku ?? "",
    quantity: item.quantity ?? 0,
    description: item.description ?? "",
    imageUrl: item.imageUrl ?? "",
  });
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm({
      brand: item.brand ?? "",
      model: item.model ?? "",
      name: item.name ?? "",
      typology: item.typology ?? "",
      categoryId: item.category?.id ? String(item.category.id) : "",
      sku: item.sku ?? "",
      quantity: item.quantity ?? 0,
      description: item.description ?? "",
      imageUrl: item.imageUrl ?? "",
    });
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
  }, [isOpen, item]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const validTitle = Boolean(
    (form.brand.trim() && form.model.trim()) || form.name.trim()
  );

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!validTitle) {
      alert("Inserisci il Nome articolo oppure Brand + Modello.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand: form.brand || null,
          model: form.model || null,
          name: form.name || null,
          typology: form.typology || null,
          categoryId: Number(form.categoryId) || null,
          sku: form.sku || null,
          quantity: Number(form.quantity) || 0,
          description: form.description || null,
          imageUrl: form.imageUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Errore aggiornamento articolo");
        setLoading(false);
        return;
      }
      // chiudi e ricarica per mostrare aggiornamenti
      onClose();
      window.location.reload();
    } catch (err) {
      alert("Errore durante l'aggiornamento");
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold">Modifica Articolo</h2>
          <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-900 p-1">✕</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-600">Brand</label>
              <input className="w-full border rounded-xl px-3 py-2" value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-zinc-600">Modello</label>
              <input className="w-full border rounded-xl px-3 py-2" value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-sm text-zinc-600">Nome articolo</label>
            <input className="w-full border rounded-xl px-3 py-2" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-zinc-600">Tipologia</label>
              <input className="w-full border rounded-xl px-3 py-2" value={form.typology}
                onChange={(e) => setForm({ ...form, typology: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-zinc-600">Categoria</label>
              <select className="w-full border rounded-xl px-3 py-2" value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Seleziona categoria…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-zinc-600">SKU</label>
              <input className="w-full border rounded-xl px-3 py-2" value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-zinc-600">Quantità</label>
              <input type="number" min={0} className="w-full border rounded-xl px-3 py-2"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: Number(e.target.value || 0) })} />
            </div>
          </div>

          <div>
            <ImageUploader label="Immagine articolo" value={form.imageUrl} onUploaded={(url) => setForm({ ...form, imageUrl: url })} />
          </div>

          <div>
            <label className="text-sm text-zinc-600">Descrizione</label>
            <textarea className="w-full border rounded-xl px-3 py-2" rows={3}
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border hover:bg-zinc-50">Annulla</button>
            <button type="submit" disabled={!validTitle || loading} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-40">
              {loading ? "Salvataggio..." : "Salva Modifiche"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
