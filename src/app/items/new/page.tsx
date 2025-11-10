"use client";
import { useEffect, useMemo, useState } from "react";
import ImageUploader from "@/components/ImageUploader";

export default function NewItemPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    brand: "",
    model: "",
    name: "",
    typology: "",
    categoryId: "",
    sku: "",
    quantity: 0,
    description: "",
    imageUrl: "", // se già carichi su /public/uploads, metti qui il path
    restricted: false,
  });

  useEffect(() => {
    // carica categorie
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  const validTitle = useMemo(() => {
    const hasBrandModel = form.brand.trim() && form.model.trim();
    const hasName = form.name.trim();
    return Boolean(hasBrandModel || hasName);
  }, [form.brand, form.model, form.name]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!validTitle) {
      alert("Inserisci il Nome articolo oppure Brand + Modello.");
      return;
    }
    console.log('Creating item with data:', {
      ...form,
      categoryId: Number(form.categoryId || 0),
      quantity: Number(form.quantity || 0),
    });
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        categoryId: Number(form.categoryId || 0),
        quantity: Number(form.quantity || 0),
      }),
    });
    const data = await res.json();
    console.log('Create item response:', res.status, data);
    if (!res.ok) {
      alert(data.error || "Errore creazione articolo");
      return;
    }
    alert("Articolo creato");
    console.log('Redirecting to home...');
    window.location.href = "/";
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Nuovo articolo</h1>
      <form onSubmit={submit} className="space-y-4 bg-white p-4 rounded-2xl border">
        <div className="grid md:grid-cols-2 gap-3 py-3">
          <div>
            <label className="text-sm text-zinc-600">Brand</label>
            <input className="w-full border rounded-xl px-3 py-2" value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="es. RCF" />
          </div>
          <div>
            <label className="text-sm text-zinc-600">Modello</label>
            <input className="w-full border rounded-xl px-3 py-2" value={form.model}
              onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="es. ART 912-A" />
          </div>
        </div>

        <div>
          <label className="text-sm text-zinc-600">Nome articolo</label>
          <input className="w-full border rounded-xl px-3 py-2" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Se non usi Brand+Modello" />
          {!validTitle && (
            <div className="text-xs text-red-600 mt-1">Inserisci Nome articolo oppure Brand + Modello.</div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-zinc-600">Tipologia</label>
            <input className="w-full border rounded-xl px-3 py-2" value={form.typology}
              onChange={(e) => setForm({ ...form, typology: e.target.value })} placeholder="es. Diffusore attivo" />
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
      onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="Codice interno" />
  </div>

  <div>
    <label className="text-sm text-zinc-600">Quantità</label>
    <input
      type="number"
      min={0}
      className="w-full border rounded-xl px-3 py-2"
      value={form.quantity}
      onChange={(e) =>
        setForm({ ...form, quantity: Number(e.target.value || 0) })
      }
    />
  </div>

  {/* RIMOZIONE input testo immagine, sostituito con uploader */}
</div>

<div>
  <ImageUploader
    label="Immagine articolo"
    value={form.imageUrl}
    onUploaded={(url) => setForm({ ...form, imageUrl: url })}
    searchQuery={
      form.brand && form.model 
        ? `${form.brand} ${form.model}` 
        : form.name || undefined
    }
  />
</div>

        <div>
          <label className="text-sm text-zinc-600">Descrizione</label>
          <textarea className="w-full border rounded-xl px-3 py-2" rows={3}
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="restricted"
            type="checkbox"
            checked={form.restricted}
            onChange={(e) => setForm({ ...form, restricted: e.target.checked })}
          />
          <label htmlFor="restricted" className="text-sm text-zinc-700">
            Visibile solo a Admin/Tech
          </label>
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={!validTitle || !form.categoryId}
            className="px-4 py-2 rounded-xl bg-light-blue text-white disabled:opacity-40">
            Salva
          </button>
        </div>
      </form>
    </div>
  );
}
